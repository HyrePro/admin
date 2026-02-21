import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    // Get query parameters with validation
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || ''
    const asc = searchParams.get('asc') || ''
    
    // Validate and sanitize pagination parameters
    const rawStartIndex = parseInt(searchParams.get('startIndex') || '0') || 0
    const rawEndIndex = parseInt(searchParams.get('endIndex') || '20') || 20
    
    // Ensure non-negative values and reasonable bounds
    const startIndex = Math.max(0, rawStartIndex)
    const endIndex = Math.min(1000, Math.max(startIndex + 1, rawEndIndex))
    
    // Additional validation for very large start indexes
    if (startIndex > 10000) {
      return NextResponse.json(
        { error: 'Start index too large. Maximum allowed is 10,000.' },
        { status: 400 }
      )
    }
    
    // Validate pagination range
    if (endIndex - startIndex > 100) {
      return NextResponse.json(
        { 
          error: 'Maximum page size is 100 items. Please reduce the range between startIndex and endIndex.',
          details: {
            requestedSize: endIndex - startIndex,
            maxAllowed: 100,
            suggestion: `Try endIndex: ${startIndex + 100}`
          }
        },
        { status: 400 }
      )
    }
    
    // Validate status parameter
    const validStatuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'PAUSED', 'APPEALED']
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid status. Valid values are: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }


    // Call the RPC with user's school_id and validated parameters
    // Using function signature without p_search parameter based on schema error
    const { data, error } = await auth.supabaseService.rpc("get_jobs_with_analytics", {
      p_school_id: auth.schoolId,
      p_start_index: startIndex,
      p_end_index: endIndex,
      p_status: status.toUpperCase(),
      p_search: search || null,
      p_sort: sort || null,
      p_asc: asc || null
    })

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: `Failed to fetch jobs: ${error.message || 'Unknown error'}`, details: error },
        { status: 500 }
      )
    }

    const { data: countData, error: countError } = await auth.supabaseService.rpc('get_jobs_count', {
      p_school_id: auth.schoolId,
      p_status: status,
      p_search: search || null
    });

    if (countError) {
      console.error('Supabase RPC error:', countError);
      return NextResponse.json(
        { error: `Failed to count jobs: ${countError.message || 'Unknown error'}`, details: countError },
        { status: 500 }
      );
    }

    let totalCount = 0;
    if (countData && Array.isArray(countData) && countData.length > 0) {
      totalCount = Number(countData[0]);
    } else if (countData && typeof countData === 'object' && 'count' in countData) {
      totalCount = Number(countData.count);
    } else if (countData && typeof countData === 'number') {
      totalCount = Number(countData);
    }

    return NextResponse.json(
      { 
        jobs: data || [],
        totalCount,
        message: 'Jobs fetched successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

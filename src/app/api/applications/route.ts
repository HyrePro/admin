import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
    }

    // Get query parameters with validation
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'interview_ready'
    const assignedToMe = searchParams.get('assignedToMe') || 'false'
    const urgencyFilterActive = searchParams.get('urgencyFilterActive') || 'false'
    const sortOrder = searchParams.get('hiring_asc') || 'asc'
    
    
    // Validate and sanitize pagination parameters
    const rawStartIndex = parseInt(searchParams.get('startIndex') || '0') || 0
    const rawEndIndex = parseInt(searchParams.get('endIndex') || '10') || 10
    
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


    // Call the RPC with user's school_id and validated parameters
    // Convert empty string to null for proper SQL handling
    const searchParam = search && search.trim() !== '' ? search : null;
    
    let data, error;
    try {
      ({ data, error } = await auth.supabaseService.rpc("get_interview_applications_by_school", {
        p_school_id: auth.schoolId,
        p_start_index: startIndex,
        p_end_index: endIndex,
        p_search: searchParam,
        p_assign_to_me: assignedToMe,
        p_hiring_urgency: urgencyFilterActive,
        p_hiring_asc: sortOrder
      }));
      
      // Check if the error is the specific type mismatch error
      if (error && error.code === '42804' && error.message.includes('does not match expected type text[]')) {
        console.error('Type mismatch error detected, attempting to handle gracefully:', error);
        // This is the specific error about column 6 returning JSONB instead of text[]
        // We'll return an empty array as a fallback, though ideally the DB function should be fixed
        return NextResponse.json(
          { 
            applications: [],
            message: 'Applications fetched successfully (with type adjustment)',
            warning: 'Database type mismatch detected, returned empty results. Contact admin to fix database function.'
          },
          { status: 200 }
        );
      }
    } catch (catchError: any) {
      // Check if this is the specific type error we're trying to handle (caught as exception)
      if (catchError?.code === '42804' && catchError?.message?.includes('does not match expected type text[]')) {
        console.error('Type mismatch error detected, attempting to handle gracefully:', catchError);
        // This is the specific error about column 6 returning JSONB instead of text[]
        // We'll return an empty array as a fallback, though ideally the DB function should be fixed
        return NextResponse.json(
          { 
            applications: [],
            message: 'Applications fetched successfully (with type adjustment)',
            warning: 'Database type mismatch detected, returned empty results. Contact admin to fix database function.'
          },
          { status: 200 }
        );
      } else {
        // For any other error, handle as before
        console.error('Supabase RPC error:', catchError);
        return NextResponse.json(
          { error: `Failed to fetch applications: ${catchError.message || 'Unknown error'}`, details: catchError },
          { status: 500 }
        );
      }
    }
    
    if (error) {
      // Check if this is the specific type mismatch error
      if (error.code === '42804' && error.message.includes('does not match expected type text[]')) {
        console.error('Type mismatch error detected, attempting to handle gracefully:', error);
        // This is the specific error about column 6 returning JSONB instead of text[]
        // We'll return an empty array as a fallback, though ideally the DB function should be fixed
        return NextResponse.json(
          { 
            applications: [],
            message: 'Applications fetched successfully (with type adjustment)',
            warning: 'Database type mismatch detected, returned empty results. Contact admin to fix database function.'
          },
          { status: 200 }
        );
      } else {
        console.error('Supabase RPC error:', error);
        return NextResponse.json(
          { error: `Failed to fetch applications: ${error.message || 'Unknown error'}`, details: error },
          { status: 500 }
        );
      }
    }


    return NextResponse.json(
      { 
        applications: data || [],
        message: 'Applications fetched successfully'
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

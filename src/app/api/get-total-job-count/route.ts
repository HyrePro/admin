import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api/client';
import { validateUserAuthAndSchool } from '@/lib/supabase/api/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate user authentication and get school_id
    const { authenticated, user, schoolId, error: authError } = await validateUserAuthAndSchool();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: authError || 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    if (!schoolId) {
      return NextResponse.json(
        { error: authError || 'User school information not found. Please complete your profile.' },
        { status: 404 }
      );
    }

    console.log('Calling RPC get_jobs_count for total count with school_id:', schoolId);
    // Call the RPC function to get job count - using the new function for consistency
    // Pass 'ALL' for status to get all jobs, and null for search to get total count
    const { data, error } = await createClient().rpc("get_jobs_count", {
      p_school_id: schoolId,
      p_status: 'ALL',
      p_search: null
    })

    console.log('RPC get_jobs_count response for total count:', { data, error });
    
    if (error) {
      console.error('Supabase RPC error in get-total-job-count:', error);
      return NextResponse.json(
        { error: `Failed to fetch job count: ${error.message || 'Unknown error'}`, details: error },
        { status: 500 }
      )
    }

    // The RPC function returns an array with the count value as the first element
    const totalCount = data && data.length > 0 ? Number(data[0]) : 0;
    console.log('Total count extracted:', totalCount);

    return NextResponse.json(
      { 
        totalJobs: totalCount,
        message: 'Job count fetched successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error in get-total-job-count:', error)
    return NextResponse.json(
      { error: `Internal server error in get-total-job-count: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters from query string
    const p_school_id = searchParams.get('p_school_id');
    const p_view = searchParams.get('p_view'); // 'day' | 'week' | 'month'
    const p_current_date = searchParams.get('p_current_date'); // Format: YYYY-MM-DD
    const p_status_filter = searchParams.get('p_status_filter') || 'all'; // 'all' | 'scheduled' | 'overdue' | 'completed'
    const p_user_id = searchParams.get('p_user_id');
    const p_job_id = searchParams.get('p_job_id');
    const p_jobs_assigned_to_me = searchParams.get('p_jobs_assigned_to_me') === 'true';
    const p_panelist = searchParams.get('p_panelist') === 'true';

    // Validate required parameters
    if (!p_school_id) {
      return NextResponse.json(
        { error: 'p_school_id is required' },
        { status: 400 }
      );
    }

    if (!p_view) {
      return NextResponse.json(
        { error: 'p_view is required (must be "day", "week", or "month")' },
        { status: 400 }
      );
    }

    if (!p_current_date) {
      return NextResponse.json(
        { error: 'p_current_date is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate p_view value
    if (!['day', 'week', 'month'].includes(p_view)) {
      return NextResponse.json(
        { error: 'p_view must be one of "day", "week", or "month"' },
        { status: 400 }
      );
    }

    // Validate p_status_filter value
    if (!['all', 'scheduled', 'overdue', 'completed'].includes(p_status_filter)) {
      return NextResponse.json(
        { error: 'p_status_filter must be one of "all", "scheduled", "overdue", or "completed"' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_interview_schedule_report', {
      p_school_id,
      p_view,
      p_current_date,
      p_status_filter,
      p_user_id: p_user_id || null,
      p_job_id: p_job_id || null,
      p_jobs_assigned_to_me,
      p_panelist: p_panelist || null
    });

    if (error) {
      console.error('Error calling get_interview_schedule_report RPC:', error);
      return NextResponse.json(
        { error: `Failed to fetch interview schedule: ${error.message}` },
        { status: 500 }
      );
    }
    console.log('Data:', data);
    for (var car in data){
      console.log('Car:', data[car].panelists);
    }
    // Return the data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Unexpected error in interview schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
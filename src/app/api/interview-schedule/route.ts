import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService || !auth.userId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Extract parameters from query string
    const p_view = searchParams.get('p_view'); // 'day' | 'week' | 'month'
    const p_current_date = searchParams.get('p_current_date'); // Format: YYYY-MM-DD
    const p_status_filter = searchParams.get('p_status_filter') || 'all'; // 'all' | 'scheduled' | 'overdue' | 'completed'
    const p_user_id = auth.userId;
    const p_job_id = searchParams.get('p_job_id');
    const p_jobs_assigned_to_me = searchParams.get('p_jobs_assigned_to_me') === 'true';
    const p_panelist = searchParams.get('p_panelist') === 'true';

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

    // Call the RPC function
    const { data, error } = await auth.supabaseService.rpc('get_interview_schedule_report', {
      p_school_id: auth.schoolId,
      p_view,
      p_current_date,
      p_status_filter,
      p_user_id: p_user_id || null,
      p_job_id: p_job_id || null,
      p_jobs_assigned_to_me,
      p_panelist
    });

    if (error) {
      console.error('Error calling get_interview_schedule_report RPC:', error);
      return NextResponse.json(
        { error: `Failed to fetch interview schedule: ${error.message}` },
        { status: 500 }
      );
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

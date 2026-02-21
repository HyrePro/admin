import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const { data, error } = await auth.supabaseService.rpc('get_interview_dashboard_stats', {
      p_school_id: auth.schoolId
    });

    if (error) {
      console.error('Error calling get_interview_dashboard_stats RPC:', error);
      return NextResponse.json(
        { error: `Failed to fetch interview stats: ${error.message}` },
        { status: 500 }
      );
    }

    // Serialize the data to ensure proper JSON representation
    // Use JSON.parse(JSON.stringify()) to handle any PostgreSQL composite types or nested objects
    const serializedData = Array.isArray(data)
      ? data.length > 0
        ? JSON.parse(JSON.stringify(data[0]))
        : {}
      : data
        ? JSON.parse(JSON.stringify(data))
        : {};
    
    // Return the fully serialized data
    return NextResponse.json(serializedData);

  } catch (error) {
    console.error('Unexpected error in interview stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

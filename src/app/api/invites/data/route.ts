import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    // Get schoolId from query parameters
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Missing required schoolId parameter' },
        { status: 400 }
      );
    }
    
    if (schoolId !== auth.schoolId) {
      return NextResponse.json(
        { error: 'Invalid school context' },
        { status: 403 }
      );
    }

    // Call the database function to get invite data
    const { data, error } = await auth.supabaseService
      .rpc('get_invite_data', { p_school_id: schoolId });

    if (error) {
      console.error('Error from get_invite_data function:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch invite data' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: data || []
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error fetching invite data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invite data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

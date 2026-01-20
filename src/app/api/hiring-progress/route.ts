import { NextRequest, NextResponse } from 'next/server';
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

    // Call the RPC function to get hiring progress data
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_hiring_progress", {
      p_school_id: schoolId
    });

    if (error) {
      console.error('Error fetching hiring progress data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hiring progress data' },
        { status: 500 }
      );
    }

    return NextResponse.json(data?.[0] || {});
  } catch (error) {
    console.error('Unexpected error in hiring-progress API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
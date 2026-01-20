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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Call the RPC function to get school jobs data
    const supabase = createClient();
    let query = supabase.rpc("get_school_jobs_data", {
      p_school_id: schoolId
    });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching school jobs data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch school jobs data' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in school-jobs API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
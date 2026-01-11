import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or anon key is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Call the database function to get invite data
    const { data, error } = await supabaseService
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
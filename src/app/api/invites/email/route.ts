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

    // Call the existing get_invite_data function and filter for email invitations
    const { data: allInviteData, error } = await supabaseService
      .rpc('get_email_invitations_by_school', { p_school_id: schoolId });

    if (error) {
      console.error('Error fetching email invitations:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch email invitations' },
        { status: 500 }
      );
    }
    
    // Filter to get only email invitations (where user_id is not null and code_id is null)
    // This represents email invitations that were sent but may or may not have been accepted yet
    const emailInvitations = allInviteData
      .filter((item: any) => item.user_id !== null && item.code_id === null)
      .map((item: any) => ({
        id: item.user_id,
        email: item.user_email,
        name: item.user_name,
        role: item.user_role,
        status: item.user_status,
        created_at: item.user_invited_at,
        expires_at: null, // Email invitations don't have a specific expiration in this format
        invited_by: item.code_created_by || 'Unknown'
      }));
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: emailInvitations
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error fetching email invitations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch email invitations';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
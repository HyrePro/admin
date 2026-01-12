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

    // Call the existing get_invite_data function and filter for invite codes
    const { data: allInviteData, error } = await supabaseService
      .rpc('get_invite_data', { p_school_id: schoolId });

    if (error) {
      console.error('Error fetching invite data:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch invite codes' },
        { status: 500 }
      );
    }
    
    // Filter to get only invite codes (where code_id is not null)
    const inviteCodes = allInviteData
      .filter((item: any) => item.code_id !== null)
      .map((item: any) => ({
        code_id: item.code_id,
        invite_code: item.invite_code,
        code_role: item.code_role,
        code_expires_at: item.code_expires_at,
        code_created_by: item.code_created_by,
        code_status: item.code_status,
        associated_user_id: item.associated_user_id,
        associated_user_name: item.associated_user_name,
        associated_user_email: item.associated_user_email,
        user_id: item.user_id,
        user_name: item.user_name,
        user_email: item.user_email,
        user_role: item.user_role,
        user_invited_at: item.user_invited_at,
        user_status: item.user_status
      }));
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: inviteCodes
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching invite codes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invite codes';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
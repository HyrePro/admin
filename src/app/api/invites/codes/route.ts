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

    // Call the existing get_invite_data function and filter for invite codes
    const { data: allInviteData, error } = await auth.supabaseService
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

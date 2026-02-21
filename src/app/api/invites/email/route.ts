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

    // Call the existing get_invite_data function and filter for email invitations
    const { data: allInviteData, error } = await auth.supabaseService
      .rpc('get_email_invitations_by_school', { p_school_id: schoolId });

    if (error) {
      console.error('Error fetching email invitations:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch email invitations' },
        { status: 500 }
      );
    }
    // Map the data from get_email_invitations_by_school function to the expected format
    const emailInvitations = allInviteData.map((item: any) => ({
        id: item.invitation_id,
        email: item.invited_email,
        name: item.invited_name,
        role: item.invited_role,
        status: item.invite_status,
        created_at: item.invite_created_at,
        expires_at: item.invite_expires_at,
        invited_by: item.invited_by_name || 'Unknown'
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

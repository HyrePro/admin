import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    // Parse request body
    const body = await request.json();
    const { schoolId, invitationId } = body;

    // Validate required fields
    if (!schoolId || !invitationId) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolId and invitationId are required' },
        { status: 400 }
      );
    }
    
    if (schoolId !== auth.schoolId) {
      return NextResponse.json(
        { error: 'Invalid school context' },
        { status: 403 }
      );
    }

    // Delete the email invitation from the invitations table
    const { error } = await auth.supabaseService
      .from('invitations')
      .delete()
      .match({ id: invitationId, school_id: schoolId });

    if (error) {
      console.error('Error deleting email invitation:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete email invitation' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Email invitation deleted'
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error deleting email invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete email invitation';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

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
    const { schoolId, itemId, itemType } = body;

    // Validate required fields
    if (!schoolId || !itemId || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolId, itemId, and itemType are required' },
        { status: 400 }
      );
    }

    if (schoolId !== auth.schoolId) {
      return NextResponse.json(
        { error: 'Invalid school context' },
        { status: 403 }
      );
    }

    // Validate itemType
    if (!['code', 'user'].includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid itemType. Must be "code" or "user"' },
        { status: 400 }
      );
    }

    // Call the database function to delete invite data
    const { error } = await auth.supabaseService
      .rpc('delete_invite_data', {
        p_school_id: schoolId,
        p_item_id: itemId,
        p_item_type: itemType
      });

    if (error) {
      console.error('Error from delete_invite_data function:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete invite data' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: itemType === 'code' ? 'Invite code deleted' : 'User removed'
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error deleting invite data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete invite data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

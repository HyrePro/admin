import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(request: NextRequest) {
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

    // Validate itemType
    if (!['code', 'user'].includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid itemType. Must be "code" or "user"' },
        { status: 400 }
      );
    }

    // Call the database function to delete invite data
    const { error } = await supabaseService
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
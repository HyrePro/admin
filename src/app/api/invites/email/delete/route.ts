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
    const { schoolId, invitationId } = body;

    // Validate required fields
    if (!schoolId || !invitationId) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolId and invitationId are required' },
        { status: 400 }
      );
    }

    // Delete the email invitation from the invitations table
    const { error } = await supabaseService
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
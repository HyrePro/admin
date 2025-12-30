import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
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
    const { name, email, role, schoolId } = body;

    console.log('Received body:', body);
    console.log('Parsed values:', { name, email, role, schoolId });

    // Validate required fields
    if (!name || !email || !role || !schoolId) {
      console.log('Validation failed:', {
        hasName: !!name,
        hasEmail: !!email,
        hasRole: !!role,
        hasSchoolId: !!schoolId
      });
      
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the database function to handle the entire invitation process
    const { data, error } = await supabaseService
      .rpc('create_invitation', {
        p_name: name,
        p_email: email,
        p_role: role,
        p_school_id: schoolId,
        p_invited_by: user.id
      });

    if (error) {
      console.error('Error from create_invitation function:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create invitation' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from invitation function' },
        { status: 500 }
      );
    }

    const result = data[0];

    // Check if the operation was successful
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error_message,
          details: result.details
        },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: result.invitation_id,
          school_id: schoolId,
          invited_by: user.id,
          email,
          name,
          role,
          token: result.token,
          status: 'pending',
          expires_at: result.details.expires_at
        },
        email_sent: result.email_sent,
        details: result.details
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Error creating invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invitation';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
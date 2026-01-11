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
    const { name, emails, role, schoolId } = body;

    console.log('Received body:', body);
    console.log('Parsed values:', { name, emails, role, schoolId });

    // Validate required fields
    if (!name || !emails || !role || !schoolId) {
      console.log('Validation failed:', {
        hasName: !!name,
        hasEmails: !!emails,
        hasRole: !!role,
        hasSchoolId: !!schoolId
      });
      
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure emails is an array
    const emailArray = Array.isArray(emails) ? emails : [emails];

    // Validate that we have at least one email
    if (emailArray.length === 0) {
      return NextResponse.json(
        { error: 'At least one email address is required' },
        { status: 400 }
      );
    }

    // Process each email individually and collect results
    const results = [];
    
    for (const email of emailArray) {
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.push({
            email,
            success: false,
            error: 'Invalid email format',
            details: null
          });
          continue;
        }
        
        // Call the database function to handle the invitation for this email
        const { data, error } = await supabaseService
          .rpc('create_invitation', {
            p_name: name,
            p_email: email,
            p_role: role,
            p_school_id: schoolId,
            p_invited_by: user.id
          });

        if (error) {
          console.error('Error from create_invitation function for email:', email, error);
          results.push({
            email,
            success: false,
            error: error.message || 'Failed to create invitation',
            details: null
          });
          continue;
        }

        if (!data || data.length === 0) {
          results.push({
            email,
            success: false,
            error: 'No data returned from invitation function',
            details: null
          });
          continue;
        }

        const result = data[0];

        // Check if the operation was successful
        if (!result.success) {
          results.push({
            email,
            success: false,
            error: result.error_message,
            details: result.details
          });
          continue;
        }
        
        // Add successful result
        results.push({
          email,
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
        });
      } catch (err) {
        console.error('Unexpected error processing email:', email, err);
        results.push({
          email,
          success: false,
          error: err instanceof Error ? err.message : 'Unexpected error occurred',
          details: null
        });
      }
    }

    // Return results for all processed invitations
    return NextResponse.json(
      {
        success: true,
        total_emails: emailArray.length,
        results
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
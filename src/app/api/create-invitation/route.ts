import { NextRequest, NextResponse } from 'next/server';
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.userId || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, emails, role, schoolId } = body;


    // Validate required fields
    if (!name || !emails || !role || !schoolId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (schoolId !== auth.schoolId) {
      return NextResponse.json(
        { error: 'Invalid school context' },
        { status: 403 }
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
        const { data, error } = await auth.supabaseService
          .rpc('create_invitation', {
            p_name: name,
            p_email: email,
            p_role: role,
            p_school_id: schoolId,
            p_invited_by: auth.userId
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
            invited_by: auth.userId,
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

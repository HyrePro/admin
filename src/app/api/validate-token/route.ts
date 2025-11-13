import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Fetch token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('evaluation_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token fetch error:', tokenError);
      return NextResponse.json(
        { error: 'Invalid token', details: tokenError?.message },
        { status: 404 }
      );
    }

    // Fetch application details separately
    const { data: applicationData, error: appError } = await supabase
      .from('job_applications')
      .select(`
        *,
        applicant_info (
          full_name,
          email
        ),
        jobs (
          title,
          description
        )
      `)
      .eq('id', tokenData.job_application_id)
      .single();

    if (appError) {
      console.error('Application fetch error:', appError);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      );
    }

    // Check if token has been used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 410 }
      );
    }

    // Return token data and application info
    return NextResponse.json({
      valid: true,
      token: tokenData,
      application: applicationData,
      panelist_email: tokenData.panelist_email,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { token, evaluation_data } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Mark token as used and store evaluation
    const { data, error } = await supabase
      .from('evaluation_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token', token)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Store evaluation data (create a separate evaluations table if needed)
    // For now, you might want to update the job_applications table or create a new evaluations table

    return NextResponse.json({
      success: true,
      message: 'Evaluation submitted successfully',
    });
  } catch (error) {
    console.error('Evaluation submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}
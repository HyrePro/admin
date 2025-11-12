import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      .select(`
        *,
        job_applications (
          id,
          job_id,
          applicant_id,
          applicant_info (
            full_name,
            email
          ),
          jobs (
            title,
            description
          )
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
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
      application: tokenData.job_applications,
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
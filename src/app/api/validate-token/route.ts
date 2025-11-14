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

    // Fetch application details
    const { data: applicationData, error: appError } = await supabase
      .from('job_applications')
      .select('id, job_id, applicant_id, user_id')
      .eq('id', tokenData.job_application_id)
      .single();

    if (appError) {
      console.error('Application fetch error:', appError);
      return NextResponse.json(
        { error: 'Failed to fetch application details', details: appError.message },
        { status: 500 }
      );
    }

    // Fetch applicant info separately
    const { data: applicantData, error: applicantError } = await supabase
      .from('applicant_info')
      .select('id, first_name, last_name, email')
      .eq('id', applicationData.applicant_id)
      .single();

    if (applicantError) {
      console.error('Applicant fetch error:', applicantError);
    }

    // Fetch job details
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, job_description, school_id')
      .eq('id', applicationData.job_id)
      .single();

    if (jobError) {
      console.error('Job fetch error:', jobError);
      return NextResponse.json(
        { error: 'Failed to fetch job details', details: jobError.message },
        { status: 500 }
      );
    }

    // Determine school_id from multiple sources
    const schoolId = tokenData.school_id || jobData?.school_id;

    console.log('School ID determined:', schoolId);

    // Fetch rubrics if we have a school_id
    let rubrics = null;
    let selectedRubric = null;
    
    if (schoolId) {
      const { data: rubricsData, error: rubricsError } = await supabase
        .rpc('get_interview_rubrics', { p_school_id: schoolId });

      if (rubricsError) {
        console.error('Rubrics fetch error:', rubricsError);
      } else {
        rubrics = rubricsData;
        
      }
    }

    // Fetch school details for branding
    let schoolData = null;
    if (schoolId) {
      const { data: school, error: schoolError } = await supabase
        .from('school_info')
        .select('id, name, logo_url')
        .eq('id', schoolId)
        .single();

      if (schoolError) {
        console.error('School fetch error:', schoolError);
      } else {
        schoolData = school;
      }
    }

    // Combine application data
    const completeApplication = {
      ...applicationData,
      applicant_info: applicantData,
      jobs: jobData
    };

    console.log('Complete application data:', completeApplication);
    console.log('Selected rubric:', rubrics);
    console.log('School data:', schoolData);

    // Return token data and application info
    return NextResponse.json({
      valid: true,
      token: tokenData,
      application: completeApplication,
      rubric: rubrics,
      school: schoolData,
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

    // Fetch token data
    const { data: tokenData, error: tokenError } = await supabase
      .from('evaluation_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('evaluation_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (updateError) {
      throw updateError;
    }

    // Calculate overall score
    const scores = evaluation_data.scores;
    const scoreValues = Object.values(scores) as number[];
    const overallScore = scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length;

    // Store evaluation in panelist_evaluations table
    const { error: evalError } = await supabase
      .from('panelist_evaluations')
      .insert({
        job_application_id: tokenData.job_application_id,
        job_id: evaluation_data.job_id,
        school_id: evaluation_data.school_id,
        panelist_email: evaluation_data.panelist_email,
        scores: scores,
        overall_score: overallScore,
        comments: evaluation_data.comments,
        strengths: evaluation_data.strengths,
        areas_for_improvement: evaluation_data.areas_for_improvement,
        recommendation: evaluation_data.recommendation,
        token_id: tokenData.id,
      });

    if (evalError) {
      console.error('Evaluation insert error:', evalError);
      throw evalError;
    }

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
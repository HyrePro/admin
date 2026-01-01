// app/api/ai/generate-job-description/route.ts
import { createClient } from '@/lib/supabase/api/server';
import { NextRequest, NextResponse } from 'next/server';

interface GenerateJDPayload {
  job_title: string;
  subjects_to_teach: string[] | string;
  grade: string;
  employment_type: string;
  experience: string;
  board: string;
  school_type: string;
  school_name: string;
  salary_range?: string;
  existing_job_description?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client (Next.js 15 compatible)
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get client IP for additional rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      'check_ai_generation_rate_limit',
      {
        p_user_id: userId,
        p_ip_address: ip !== 'unknown' ? ip : null,
      }
    );

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      return NextResponse.json(
        { error: 'Rate limit check failed. Please try again.' },
        { status: 500 }
      );
    }

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          reason: rateLimitCheck.reason,
          limit: rateLimitCheck.limit,
          reset_at: rateLimitCheck.reset_at,
          message: getRateLimitMessage(rateLimitCheck.reason),
        },
        { status: 429 }
      );
    }

    // Parse and validate payload
    let payload: GenerateJDPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const required: (keyof GenerateJDPayload)[] = [
      'job_title',
      'subjects_to_teach',
      'grade',
      'employment_type',
      'experience',
      'board',
      'school_type',
      'school_name',
    ];

    for (const field of required) {
      if (!payload[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Additional validation
    if (payload.job_title.length > 200) {
      return NextResponse.json(
        { error: 'Job title too long (max 200 characters)' },
        { status: 400 }
      );
    }

    if (payload.existing_job_description && 
        payload.existing_job_description.length > 5000) {
      return NextResponse.json(
        { error: 'Job description too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Log the generation attempt
    const operationType = payload.existing_job_description ? 'optimize' : 'generate';
    
    try {
      // Get fresh session for edge function call
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Session expired. Please refresh and try again.' },
          { status: 401 }
        );
      }

      // Call the edge function
      const edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + 
        '/functions/v1/generate-job-description';
      
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await edgeResponse.json();

      if (!edgeResponse.ok) {
        // Log failed attempt
        await supabase.rpc('log_ai_generation', {
          p_user_id: userId,
          p_operation_type: operationType,
          p_job_title: payload.job_title,
          p_ip_address: ip !== 'unknown' ? ip : null,
          p_user_agent: req.headers.get('user-agent') || null,
          p_success: false,
          p_error_message: result.error || 'Edge function failed',
        });

        return NextResponse.json(
          { error: result.error || 'Failed to generate job description' },
          { status: edgeResponse.status }
        );
      }

      // Log successful generation
      await supabase.rpc('log_ai_generation', {
        p_user_id: userId,
        p_operation_type: operationType,
        p_job_title: payload.job_title,
        p_ip_address: ip !== 'unknown' ? ip : null,
        p_user_agent: req.headers.get('user-agent') || null,
        p_success: true,
        p_error_message: null,
      });

      // Return success with remaining quota
      return NextResponse.json({
        ...result,
        quota: {
          remaining_hour: rateLimitCheck.remaining_hour - 1,
          remaining_day: rateLimitCheck.remaining_day - 1,
        },
      });

    } catch (error: unknown) {
      console.error('Edge function call error:', error);
      
      // Log error
      await supabase.rpc('log_ai_generation', {
        p_user_id: userId,
        p_operation_type: operationType,
        p_job_title: payload.job_title,
        p_ip_address: ip !== 'unknown' ? ip : null,
        p_user_agent: req.headers.get('user-agent') || null,
        p_success: false,
        p_error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

  } catch (error: unknown) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRateLimitMessage(reason: string): string {
  switch (reason) {
    case 'hourly_limit_exceeded':
      return 'You have reached your hourly limit for AI generations. Please try again later.';
    case 'daily_limit_exceeded':
      return 'You have reached your daily limit for AI generations. Please try again tomorrow.';
    case 'ip_limit_exceeded':
      return 'Too many requests from your network. Please try again later.';
    default:
      return 'Rate limit exceeded. Please try again later.';
  }
}
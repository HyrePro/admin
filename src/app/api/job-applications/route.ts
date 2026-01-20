import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    // Validate required env
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or anon key is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    // Validate service role key is available
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Service client for RPC operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from request cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Try to get user from cookies first (primary method)
    let user = null;
    let userError = null;

    try {
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      user = cookieUser;
      userError = cookieError;
    } catch (error) {
      console.log('Cookie auth failed, trying Authorization header...');
    }

    // If cookie auth failed, try Authorization header (fallback)
    if (!user) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
          user = tokenUser;
          userError = tokenError;
        } catch (error) {
          console.log('Token auth also failed:', error);
        }
      }
    }

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get user's admin info to retrieve school_id
    const { data: adminInfo, error: adminError } = await supabaseService
      .from('admin_user_info')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminInfo?.school_id) {
      return NextResponse.json(
        { error: 'User school information not found. Please complete your profile.' },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const startIndex = parseInt(searchParams.get('startIndex') || '0') || 0;
    const endIndex = parseInt(searchParams.get('endIndex') || '10') || 10;
    const search = searchParams.get('search') || '';

    // Validate required parameters
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required parameter: jobId' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    const MAX_INDEX = 10000;
    const MAX_PAGE_SIZE = 100;

    if (startIndex < 0 || startIndex > MAX_INDEX) {
      return NextResponse.json(
        { error: `Start index must be between 0 and ${MAX_INDEX}` },
        { status: 400 }
      );
    }

    const requestedEndIndex = Math.max(startIndex + 1, endIndex);
    if (requestedEndIndex - startIndex > MAX_PAGE_SIZE) {
      return NextResponse.json(
        { error: `Maximum page size is ${MAX_PAGE_SIZE} items` },
        { status: 400 }
      );
    }

    const validatedEndIndex = Math.min(requestedEndIndex, MAX_INDEX);

    // Validate search text length
    if (search && search.length > 100) {
      return NextResponse.json(
        { error: 'Search text too long. Maximum 100 characters allowed.' },
        { status: 400 }
      );
    }

    console.log('Fetching job applications with parameters:', {
      jobId,
      startIndex,
      validatedEndIndex,
      search,
      schoolId: adminInfo.school_id
    });

    // Call the RPC function to get job applications
    const { data: applicationsData, error: applicationsError } = await supabaseService.rpc('get_job_applications', {
      p_job_id: jobId,
      p_start_index: startIndex,
      p_end_index: validatedEndIndex,
      p_search: search.trim(),
    });

    if (applicationsError) {
      console.error('Error fetching job applications:', applicationsError);
      return NextResponse.json(
        { error: `Failed to fetch job applications: ${applicationsError.message}` },
        { status: 500 }
      );
    }

    // Get total count for the job applications
    let countQuery = supabaseService
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);
    
    if (search) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { count: totalApplications, error: countError } = await countQuery;

    if (countError) {
      console.error('Error fetching total applications count:', countError);
      // Continue with applications data even if count fails
      return NextResponse.json({
        applications: applicationsData || [],
        total: 0,
        message: 'Applications fetched successfully (count unavailable)'
      }, { status: 200 });
    }

    return NextResponse.json({
      applications: applicationsData || [],
      total: totalApplications || 0,
      message: 'Applications fetched successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('API error in job-applications route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
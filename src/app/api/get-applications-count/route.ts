import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  console.log("RPC get applications count: Request received")
  try {
    // Validate required env
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or anon key is not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    // Validate service role key is available
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Service client for RPC operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from request cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Try to get user from cookies first (primary method)
    let user = null
    let userError = null

    try {
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
      user = cookieUser
      userError = cookieError
    } catch (error) {
      console.log('Cookie auth failed, trying Authorization header...')
    }

    // If cookie auth failed, try Authorization header (fallback)
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
          user = tokenUser
          userError = tokenError
        } catch (error) {
          console.log('Token auth also failed:', error)
        }
      }
    }

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Get user's admin info to retrieve school_id
    const { data: adminInfo, error: adminError } = await supabaseService
      .from('admin_user_info')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminInfo?.school_id) {
      return NextResponse.json(
        { error: 'User school information not found. Please complete your profile.' },
        { status: 404 }
      )
    }

    // Get query parameters with validation
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';
    
    // Validate status parameter
    const validStatuses = ['ALL', 'in_progress', 'application_submitted', 'assessment_in_progress', 'assessment_in_evaluation', 'assessment_evaluated', 'assessment_ready', 'assessment_failed', 'demo_creation', 'demo_ready', 'demo_in_progress', 'demo_in_evaluation', 'demo_evaluated', 'demo_failed', 'interview_in_progress', 'interview_ready', 'interview_scheduled', 'paused', 'completed', 'suspended', 'appealed', 'withdrawn', 'offered', 'panelist_review_in_progress'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid status. Valid values are: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    console.log('RPC get applications count: Query parameters:', { status, search })
    // Call the RPC with user's school_id and parameters
    const { data: countData, error } = await supabaseService.rpc('get_applications_count_by_school', {
      p_school_id: adminInfo.school_id,
      p_status: status,
      p_search: search || null
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: `Failed to count applications: ${error.message || 'Unknown error'}`, details: error },
        { status: 500 }
      );
    }
    console.log('RPC get applications count: Supabase RPC response:', countData);
    // Extract the count - Supabase RPC can return different data structures
    let count = 0;
    if (countData && Array.isArray(countData) && countData.length > 0) {
      // If it's an array, get the first element
      count = Number(countData[0]);
    } else if (countData && typeof countData === 'object' && 'count' in countData) {
      // If it's an object with a count property
      count = Number(countData.count);
    } else if (countData && typeof countData === 'number') {
      // If it's already a number
      count = Number(countData);
    } else if (countData && Array.isArray(countData) && countData.length === 0) {
      // If it's an empty array
      count = 0;
    } else {
      // Fallback
      count = 0;
    }
    console.log('RPC get applications count: Processed count value:', count);

    return NextResponse.json(
      { 
        count: count,
        message: 'Applications count fetched successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
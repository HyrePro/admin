import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
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

    console.log('Fetching interview rubrics for school_id:', adminInfo.school_id)

    // Call the RPC function to get interview rubrics
    const { data, error } = await supabaseService.rpc("get_interview_rubrics", {
      p_school_id: adminInfo.school_id
    })

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: `Failed to fetch interview rubrics: ${error.message || 'Unknown error'}`, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        rubrics: data || [],
        message: 'Interview rubrics fetched successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
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

    // Get query parameters with validation
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'created_at'
    const ascParam = searchParams.get('asc') || 'false'
    const asc = ascParam.toLowerCase() === 'true'
    
    // Validate and sanitize pagination parameters
    const rawStartIndex = parseInt(searchParams.get('startIndex') || '0') || 0
    const rawEndIndex = parseInt(searchParams.get('endIndex') || '20') || 20
    
    // Ensure non-negative values and reasonable bounds
    const startIndex = Math.max(0, rawStartIndex)
    const endIndex = Math.min(1000, Math.max(startIndex + 1, rawEndIndex))
    
    // Additional validation for very large start indexes
    if (startIndex > 10000) {
      return NextResponse.json(
        { error: 'Start index too large. Maximum allowed is 10,000.' },
        { status: 400 }
      )
    }
    
    // Validate pagination range
    if (endIndex - startIndex > 100) {
      return NextResponse.json(
        { 
          error: 'Maximum page size is 100 items. Please reduce the range between startIndex and endIndex.',
          details: {
            requestedSize: endIndex - startIndex,
            maxAllowed: 100,
            suggestion: `Try endIndex: ${startIndex + 100}`
          }
        },
        { status: 400 }
      )
    }

    console.log('Fetching applications with parameters:', { status, search, sort, asc, startIndex, endIndex })

    // Call the RPC with user's school_id and validated parameters
    // Convert empty string to null for proper SQL handling
    const searchParam = search && search.trim() !== '' ? search : null;
    
    // Use the sorted function that supports sorting in the database
    const { data, error } = await supabaseService.rpc("get_applications_by_school_sorted", {
      p_school_id: adminInfo.school_id,
      p_start_index: startIndex,
      p_end_index: endIndex,
      p_search: searchParam || 'ALL', // Use 'ALL' for no search
      p_status: status,
      p_sort: sort,
      p_asc: asc
    })

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: `Failed to fetch applications: ${error.message || 'Unknown error'}`, details: error },
        { status: 500 }
      )
    }

    console.log('RPC get applications sorted: Database sorted response:', data);

    return NextResponse.json(
      { 
        applications: data || [],
        message: 'Applications fetched successfully'
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
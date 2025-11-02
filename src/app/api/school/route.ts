import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

// Ensure anon key is available for SSR auth
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for SSR auth')
}

// Ensure service role key is available for admin operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// Service client for admin operations
const supabaseService = createClient(supabaseUrl as string, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    // Get user from request cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl as string,
      supabaseAnonKey as string,
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      location, 
      board, 
      address, 
      school_type, 
      num_students, 
      num_teachers, 
      website, 
      logo_url
    } = body

    // Validate required fields
    if (!name || !location || !board || !address || !school_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, location, board, address, school_type' },
        { status: 400 }
      )
    }

    // Insert data into school_info table using service client
    const { data: schoolData, error: schoolError } = await supabaseService
      .from('school_info')
      .insert([
        {
          name,
          location,
          board,
          address,
          school_type,
          num_students: num_students ? parseInt(num_students) : null,
          num_teachers: num_teachers ? parseInt(num_teachers) : null,
          website: website || null,
          logo_url: logo_url || null,
          created_by: user.id
        }
      ])
      .select()
      .single()

    if (schoolError) {
      console.error('School creation error:', schoolError)
      return NextResponse.json(
        { error: 'Failed to create school' },
        { status: 500 }
      )
    }

    // Update admin user with school_id using service client
    const { error: updateError } = await supabaseService
      .from('admin_user_info')
      .update({ school_id: schoolData.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Admin user update error:', updateError)
      // Try to clean up the created school if user update fails
      await supabaseService
        .from('school_info')
        .delete()
        .eq('id', schoolData.id)
      
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'School created and user updated successfully',
        school: schoolData
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from request cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl as string,
      supabaseAnonKey as string,
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
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

    const body = await request.json()
    const { 
      name, 
      location, 
      board, 
      address, 
      school_type, 
      num_students, 
      num_teachers, 
      website, 
      logo_url
    } = body

    // Validate required fields
    if (!name || !location || !board || !address || !school_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, location, board, address, school_type' },
        { status: 400 }
      )
    }

    // Update data in school_info table using service client
    const { data: schoolData, error: schoolError } = await supabaseService
      .from('school_info')
      .update({
        name,
        location,
        board,
        address,
        school_type,
        num_students: num_students ? parseInt(num_students) : null,
        num_teachers: num_teachers ? parseInt(num_teachers) : null,
        website: website || null,
        logo_url: logo_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminInfo.school_id)
      .select()
      .single()

    if (schoolError) {
      console.error('School update error:', schoolError)
      return NextResponse.json(
        { error: 'Failed to update school' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'School updated successfully',
        school: schoolData
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
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

    // Instead of just updating, we'll upsert the admin_user_info record
    // This ensures that even if the record doesn't exist, it will be created
    // with all the necessary user information
    const { error: upsertError } = await supabaseService
      .from('admin_user_info')
      .upsert({
        id: user.id,
        school_id: schoolData.id,
        first_name: user.user_metadata?.name || null,
        last_name: user.user_metadata?.last_name || null,
        email: user.email,
        phone_no: user.user_metadata?.contact_number || null,
        avatar: user.user_metadata?.avatar_url || null,
        role: 'admin'
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('Admin user upsert error:', upsertError)
      // Try to clean up the created school if user upsert fails
      await supabaseService
        .from('school_info')
        .delete()
        .eq('id', schoolData.id)
      
      return NextResponse.json(
        { error: 'Failed to create or update user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'School created and user profile updated successfully',
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
      // If no admin info exists, we'll create it with the upsert operation below
      console.warn('User admin info not found, will create during upsert')
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

    let schoolId = adminInfo?.school_id;

    // If no school exists for this user, we might need to handle this case differently
    // For now, we'll assume the school already exists as this is an update operation
    if (!schoolId) {
      return NextResponse.json(
        { error: 'User school information not found. Please complete your profile.' },
        { status: 404 }
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
      .eq('id', schoolId)
      .select()
      .single()

    if (schoolError) {
      console.error('School update error:', schoolError)
      return NextResponse.json(
        { error: 'Failed to update school' },
        { status: 500 }
      )
    }

    // Upsert the admin_user_info record to ensure it exists
    // This handles cases where the record might not have been created properly
    const { error: upsertError } = await supabaseService
      .from('admin_user_info')
      .upsert({
        id: user.id,
        school_id: schoolData.id,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        email: user.email,
        phone_no: user.user_metadata?.contact_number || null,
        avatar: user.user_metadata?.avatar_url || null,
        role: 'admin'
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('Admin user upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Service client for admin operations
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
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
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
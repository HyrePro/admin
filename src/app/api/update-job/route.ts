import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/api/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function PUT(request: NextRequest) {
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

    // Service client for database operations
    const supabaseService = await createClient()

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

    // Try to get user from cookies
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

    // Parse request body
    const body = await request.json()
    const { jobId, ...updateData } = body

    // Validate jobId
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data - only include fields that are allowed to be updated
    // Based on the database schema:
    // id, title, job_type, mode, grade_levels, subjects, salary_range, openings, 
    // job_description, assessment_difficulty, created_at, school_id, number_of_questions,
    // status, minimum_passing_marks, created_by, demo_duration, demo_passing_score,
    // assessment_type, plan, max_applications
    const allowedFields = [
      'title',
      'job_type',
      'mode',
      'grade_levels',
      'subjects',
      'salary_range',
      'openings',
      'job_description'
    ]

    const filteredUpdateData: Record<string, any> = {}
    
    // Only include allowed fields in the update
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key]
      }
    })

    // Add updated_at timestamp
    filteredUpdateData.updated_at = new Date().toISOString()

    // Update the job record - ensure it belongs to the user's school
    const { data, error } = await supabaseService
      .from('jobs')
      .update(filteredUpdateData)
      .eq('id', jobId)
      .eq('school_id', adminInfo.school_id) // Ensure user can only update jobs from their school
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json(
        { error: 'Failed to update job: ' + error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        job: data,
        message: 'Job updated successfully'
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
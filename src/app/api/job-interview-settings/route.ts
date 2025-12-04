import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Ensure service role key is available for admin operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service client for database operations
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface JobInterviewSettings {
  job_id: string;
  school_id: string;
  default_interview_type?: string;
  default_duration?: string;
  candidate_reminder_hours?: string;
  interviewer_reminder_hours?: string;
  custom_instructions?: string;
  slots?: [];
}

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
          const { data: { user: tokenUser }, error: tokenError } = await supabaseService.auth.getUser(token)
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

    // Parse and validate request body
    const settingsData: JobInterviewSettings = await request.json()
    
    const {
      job_id,
      school_id,
      default_interview_type,
      default_duration,
      candidate_reminder_hours,
      interviewer_reminder_hours,
      custom_instructions,
      slots
    } = settingsData

    // Validate required fields
    if (!job_id || !school_id) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id, school_id' },
        { status: 400 }
      )
    }

    // Validate that job belongs to user's school
    const { data: jobData, error: jobError } = await supabaseService
      .from('jobs')
      .select('id, school_id')
      .eq('id', job_id)
      .eq('school_id', adminInfo.school_id)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json(
        { error: 'Job not found or does not belong to your school' },
        { status: 404 }
      )
    }

    // Insert or update job meeting settings
    const { data, error } = await supabaseService
      .from('job_meeting_settings')
      .upsert({
        job_id,
        school_id,
        default_interview_type: default_interview_type || 'in-person',
        default_duration: default_duration || '30',
        candidate_reminder_hours: candidate_reminder_hours || '24',
        interviewer_reminder_hours: interviewer_reminder_hours || '1',
        custom_instructions: custom_instructions || 'Please arrive 10 minutes early for your interview.',
        slots: slots || null
      }, {
        onConflict: 'job_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Job interview settings error:', error)
      return NextResponse.json(
        { error: 'Failed to save job interview settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        data,
        message: 'Job interview settings saved successfully'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      )
    }

    // Get job meeting settings
    const { data, error } = await supabaseService
      .from('job_meeting_settings')
      .select('*')
      .eq('job_id', jobId)
      .single()

    if (error) {
      console.error('Job interview settings fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job interview settings' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No job interview settings found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        data,
        message: 'Job interview settings fetched successfully'
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
import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

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
    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
    }

    // Parse and validate request body
    const settingsData: JobInterviewSettings = await request.json()
    
    const {
      job_id,
      default_interview_type,
      default_duration,
      candidate_reminder_hours,
      interviewer_reminder_hours,
      custom_instructions,
      slots
    } = settingsData

    // Validate required fields
    if (!job_id) {
      return NextResponse.json(
        { error: 'Missing required field: job_id' },
        { status: 400 }
      )
    }

    // Validate that job belongs to user's school
    const { data: jobData, error: jobError } = await auth.supabaseService
      .from('jobs')
      .select('id, school_id')
      .eq('id', job_id)
      .eq('school_id', auth.schoolId)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json(
        { error: 'Job not found or does not belong to your school' },
        { status: 404 }
      )
    }

    // Insert or update job meeting settings
    const { data, error } = await auth.supabaseService
      .from('job_meeting_settings')
      .upsert({
        job_id,
        school_id: auth.schoolId,
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

    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
    }

    // Get job meeting settings, ensure job belongs to school
    const { data: jobData, error: jobError } = await auth.supabaseService
      .from('jobs')
      .select('id, school_id')
      .eq('id', jobId)
      .eq('school_id', auth.schoolId)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json(
        { error: 'Job not found or does not belong to your school' },
        { status: 404 }
      )
    }

    const { data, error } = await auth.supabaseService
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

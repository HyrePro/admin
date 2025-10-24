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

export interface CreateJobInput {
  jobTitle: string
  schoolName: string
  location: string
  experience: string
  employmentType: string
  salaryMin?: string
  salaryMax?: string
  subjects: string[]
  gradeLevel: string[]
  jobDescription: string
  requirements: string[]
  includeSubjectTest?: boolean
  subjectTestDuration?: number
  demoVideoDuration?: number
  includeInterview?: boolean
  interviewFormat?: string
  interviewDuration?: number
  interviewQuestions: { id: string | number; question: string }[]
  assessmentDifficulty?: string
  numberOfQuestions?: number
  minimumPassingMarks?: number
  numberOfOpenings?: number
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
    const jobData: CreateJobInput = await request.json()
    
    const {
      jobTitle,
      location,
      experience,
      employmentType,
      salaryMin,
      salaryMax,
      subjects,
      gradeLevel,
      jobDescription,
      requirements,
      includeSubjectTest,
      subjectTestDuration,
      demoVideoDuration,
      includeInterview,
      interviewFormat,
      interviewDuration,
      interviewQuestions,
      assessmentDifficulty,
      numberOfQuestions,
      minimumPassingMarks,
      numberOfOpenings,
    } = jobData

    // Validate required fields
    if (!jobTitle || !subjects?.length || !gradeLevel?.length || !employmentType) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, subjects, gradeLevel, employmentType' },
        { status: 400 }
      )
    }

    // Compose salary range string
    let salary_range = ""
    const minNum = salaryMin ? Number(String(salaryMin).replace(/[^\d.]/g, '')) : undefined
    const maxNum = salaryMax ? Number(String(salaryMax).replace(/[^\d.]/g, '')) : undefined

    // Validate that provided values are numeric
    if ((Number.isNaN(minNum) && salaryMin) || (Number.isNaN(maxNum) && salaryMax)) {
      return NextResponse.json(
        { error: 'salaryMin/salaryMax must be numbers' },
        { status: 400 }
      )
    }

    // Validate demoVideoDuration if provided
    if (demoVideoDuration !== undefined && (demoVideoDuration < 0 || demoVideoDuration > 10)) {
      return NextResponse.json(
        { error: 'demoVideoDuration must be between 0 and 10 minutes' },
        { status: 400 }
      )
    }
    
    // Validate numberOfQuestions if provided
    if (numberOfQuestions !== undefined && (numberOfQuestions < 0 || numberOfQuestions > 30)) {
      return NextResponse.json(
        { error: 'numberOfQuestions must be between 0 and 30' },
        { status: 400 }
      )
    }

    // Enforce min ≤ max
    if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      return NextResponse.json(
        { error: 'salaryMin cannot exceed salaryMax' },
        { status: 400 }
      )
    }

    // Build the display string
    if (minNum !== undefined && maxNum !== undefined) {
      salary_range = `₹${minNum} - ₹${maxNum}`
    } else if (minNum !== undefined) {
      salary_range = `₹${minNum}+`
    } else if (maxNum !== undefined) {
      salary_range = `Up to ₹${maxNum}`
    }
    // Compose assessment_difficulty JSON
    const assessment_difficulty = {
      subjectScreening: includeSubjectTest || false,
      includeVideoAssessment: !!demoVideoDuration,
      includeInterview: includeInterview || false,
      includeSubjectTest,
      subjectTestDuration,
      demoVideoDuration,
      interviewFormat,
      interviewDuration,
      interviewQuestions,
      assessmentDifficulty: includeSubjectTest ? assessmentDifficulty : undefined,
      numberOfQuestions: includeSubjectTest ? numberOfQuestions : undefined,
      minimumPassingMarks: includeSubjectTest ? minimumPassingMarks : undefined,
    }

    // Insert into jobs table with user's school_id
    const { data, error } = await supabaseService.from("jobs").insert([
      {
        title: jobTitle,
        job_type: employmentType,
        location,
        mode: experience,
        grade_levels: gradeLevel,
        subjects,
        salary_range,
        openings: numberOfOpenings || 1, // Use numberOfOpenings or default to 1
        job_description: jobDescription,
        responsibilities: "", // Not provided in jobData
        requirements: requirements.join("\n"),
        assessment_difficulty,
        created_at: new Date().toISOString(),
        number_of_questions: includeSubjectTest ? numberOfQuestions : 10,
        minimum_passing_marks: includeSubjectTest ? minimumPassingMarks : 0,
        school_id: adminInfo.school_id, // Use dynamic school_id from user metadata
      },
    ]).select("id").single()

    if (error) {
      console.error('Job creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        data,
        message: 'Job created successfully'
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
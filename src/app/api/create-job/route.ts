import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

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
  demoVideoPassingScore?: number
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.schoolId || !auth.supabaseService || !auth.userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
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
      demoVideoPassingScore
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
      includeInterview: includeInterview || false
    }

    // Insert into jobs table with user's school_id
    const { data, error } = await auth.supabaseService.from("jobs").insert([
      {
        title: jobTitle,
        job_type: employmentType,
        mode: experience,
        grade_levels: gradeLevel,
        subjects,
        salary_range,
        openings: numberOfOpenings || 1, // Use numberOfOpenings or default to 1
        job_description: jobDescription,
        assessment_difficulty,
        created_at: new Date().toISOString(),
        number_of_questions: includeSubjectTest ? numberOfQuestions : 10,
        minimum_passing_marks: includeSubjectTest ? minimumPassingMarks : 0,
        school_id: auth.schoolId, // Use dynamic school_id from user metadata
        created_by: auth.userId,
        demo_duration: demoVideoDuration || 0,
        demo_passing_score: demoVideoPassingScore || 0,
      assessment_type: assessmentDifficulty,
      status: 'processing'
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

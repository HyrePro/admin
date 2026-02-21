import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

export async function PUT(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
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

    const filteredUpdateData: Record<string, string | number | boolean | Date | null | undefined> = {}
    
    // Only include allowed fields in the update
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key]
      }
    })

    // Add updated_at timestamp
    filteredUpdateData.updated_at = new Date().toISOString()

    // Update the job record - ensure it belongs to the user's school
    const { data, error } = await auth.supabaseService
      .from('jobs')
      .update(filteredUpdateData)
      .eq('id', jobId)
      .eq('school_id', auth.schoolId) // Ensure user can only update jobs from their school
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

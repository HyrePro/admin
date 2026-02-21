import { NextRequest, NextResponse } from 'next/server'
import { resolveUserAndSchoolId } from '@/lib/supabase/api/route-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request)
    if (auth.error || !auth.userId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Please log in.' }, { status: auth.status || 401 })
    }

    // Parse request body
    const body = await request.json()
    const { emails, jobId } = body

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json(
        { error: 'Job ID is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Prepare data for insertion
    const invitations = emails.map(email => ({
      job_id: jobId,
      candidate_email: email,
      invited_by: auth.userId
    }))

    // Insert into job_invitations table
    const { data, error } = await auth.supabaseService
      .from('job_invitations')
      .insert(invitations)
      .select()

    if (error) {
      console.error('Error inserting job invitations:', error)
      
      // Handle duplicate key violation
      if (error.code === '23505') {
        // Extract information about which emails already exist
        return NextResponse.json(
          { 
            error: 'Some invitations already exist',
            message: `Invitations already exist for: ${emails.join(', ')}`
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create job invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        data,
        message: `${invitations.length} invitation(s) created successfully`
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

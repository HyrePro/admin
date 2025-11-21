import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
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
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

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

    // Get user from cookies
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
      invited_by: user.id
    }))

    // Insert into job_invitations table
    const { data, error } = await supabaseService
      .from('job_invitations')
      .insert(invitations)
      .select()

    if (error) {
      console.error('Error inserting job invitations:', error)
      
      // Handle duplicate key violation
      if (error.code === '23505') {
        // Extract information about which emails already exist
        const existingEmails = await getExistingInvitations(supabaseService, jobId, emails);
        return NextResponse.json(
          { 
            error: 'Some invitations already exist',
            existingEmails: existingEmails,
            message: `Invitations already exist for: ${existingEmails.join(', ')}`
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

// Helper function to get existing invitations
async function getExistingInvitations(supabaseService: any, jobId: string, emails: string[]) {
  const { data, error } = await supabaseService
    .from('job_invitations')
    .select('candidate_email')
    .eq('job_id', jobId)
    .in('candidate_email', emails);
  
  if (error) {
    console.error('Error fetching existing invitations:', error);
    return [];
  }
  
  return data.map((item: any) => item.candidate_email) || [];
}

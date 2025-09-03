import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface AdminUserInsertData {
  first_name: string
  last_name: string
  email: string
  phone_no: string
  school_id: null
  id?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Ensure service role key is available for admin operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, phone_no, user_id } = body

    // Validate required fields
    if (!first_name || !last_name || !email || !phone_no) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert data into admin_user_info table
    const insertData: AdminUserInsertData = {
      first_name,
      last_name,
      email,
      phone_no: phone_no,
      school_id: null // Set to null initially as per requirements
    }

    // If user_id is provided, use it as the id (for linking with auth.users)
    if (user_id) {
      insertData.id = user_id
    }

    const { data, error } = await supabase
      .from('admin_user_info')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to insert user info' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Admin user info created successfully',
        data 
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

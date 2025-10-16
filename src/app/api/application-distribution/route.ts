import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    // Get user info from admin_user_info table to get school_id
    const { data: userInfo, error: userError } = await supabase
      .from('admin_user_info')
      .select('school_id')
      .eq('id', session.user.id)
      .single()
    
    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
    
    if (!userInfo?.school_id) {
      return NextResponse.json({ error: 'User not associated with a school' }, { status: 400 })
    }
    
    // Call the RPC function with the user's school_id
    const { data, error } = await supabase.rpc("get_application_distribution", {
      school_id: userInfo.school_id,
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching application distribution:', error)
    return NextResponse.json({ error: 'Failed to fetch application distribution' }, { status: 500 })
  }
}
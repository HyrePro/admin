// Create service client for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/api/server'

// Ensure service role key is available for admin operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const cookieStore = await cookies()

  if (code) {
    const supabase = await createClient()
    
    try {
      // Exchange the authorization code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error.message)
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=auth_error&message=${encodeURIComponent('Authentication failed. Please try again.')}`
        )
      }

      if (data.session && data.user) {
        // For password reset flows, we don't need email confirmation check
        const isPasswordReset = next === '/auth/reset-password'
        
        if (!isPasswordReset) {
          // Check if user email is confirmed for regular logins
          if (!data.user.email_confirmed_at) {
            return NextResponse.redirect(
              `${requestUrl.origin}/login?error=email_not_confirmed&message=${encodeURIComponent('Please check your email and confirm your account.')}`
            )
          }
        }

        // Check user's school_id status to determine where to redirect
        try {
          const { data: userInfo, error: userInfoError } = await supabase
            .from('admin_user_info')
            .select('school_id')
            .eq('id', data.user.id)
            .single()
          
          if (userInfoError) {
            console.error('Error fetching user info:', userInfoError)
            // If we can't determine user info, redirect to select organization
            return NextResponse.redirect(`${requestUrl.origin}/select-organization`)
          }
          
          // If user has a school_id, redirect to dashboard
          if (userInfo && userInfo.school_id) {
            return NextResponse.redirect(`${requestUrl.origin}/`)
          } 
          // Otherwise, redirect to select organization
          else {
            return NextResponse.redirect(`${requestUrl.origin}/select-organization`)
          }
        } catch (error) {
          console.error('Error checking user organization status:', error)
          // If there's an error checking user info, redirect to select organization
          return NextResponse.redirect(`${requestUrl.origin}/select-organization`)
        }
      } else {
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=session_error&message=${encodeURIComponent('Failed to create session. Please try again.')}`
        )
      }
    } catch (error) {
      console.error('Unexpected error during authentication callback:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=server_error&message=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
      )
    }
  }

  // No authorization code provided
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=missing_code&message=${encodeURIComponent('Authorization code missing. Please try again.')}`
  )
}
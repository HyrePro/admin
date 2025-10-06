// Create service client for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Ensure service role key is available for admin operations
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createRouteHandlerClient({ cookies })

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const cookieStore = cookies()

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
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
        const isSelectOrganization = next === '/select-organization'
        
        if (!isPasswordReset && !isSelectOrganization) {
          // Check if user email is confirmed for regular logins
          if (!data.user.email_confirmed_at) {
            return NextResponse.redirect(
              `${requestUrl.origin}/login?error=email_not_confirmed&message=${encodeURIComponent('Please check your email and confirm your account.')}`
            )
          }
        }

        // For organization selection flow, verify this is a new user completing signup
        if (isSelectOrganization) {
          // Check if user has completed organization setup by checking admin_user_info
          // If they have a school_id already set, redirect them to dashboard instead
          try {
            const { data: userInfo } = await supabase
              .from('admin_user_info')
              .select('school_id')
              .eq('id', data.user.id)
              .single()
            
            if (userInfo && userInfo.school_id) {
              // User already has organization set up, redirect to dashboard
              return NextResponse.redirect(`${requestUrl.origin}/`)
            }
          } catch (error) {
            console.error('Error checking user organization status:', error)
            // Continue with organization selection if we can't determine status
          }
        }

        // Validate redirect URL to prevent open redirect attacks
        const allowedRedirects = ['/', '/jobs', '/settings', '/help', '/auth/reset-password', '/select-organization']
        const redirectPath = allowedRedirects.includes(next) ? next : '/'
        
        // Successful authentication - redirect to requested page
        return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)
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
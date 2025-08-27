import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const cookieStore = await cookies()

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
        // Check if user email is confirmed
        if (!data.user.email_confirmed_at) {
          return NextResponse.redirect(
            `${requestUrl.origin}/login?error=email_not_confirmed&message=${encodeURIComponent('Please check your email and confirm your account.')}`
          )
        }

        // Validate redirect URL to prevent open redirect attacks
        const allowedRedirects = ['/dashboard', '/jobs', '/settings', '/help']
        const redirectPath = allowedRedirects.includes(next) ? next : '/dashboard'
        
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

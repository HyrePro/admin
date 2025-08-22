import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        // Redirect to login with error
        return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
      }

      if (data.session) {
        // Successfully verified and authenticated
        // Check if email is confirmed
        if (data.user?.email_confirmed_at) {
          // Email confirmed, redirect to dashboard
          return NextResponse.redirect(`${requestUrl.origin}${next}`)
        } else {
          // This shouldn't happen normally, but handle it gracefully
          return NextResponse.redirect(`${requestUrl.origin}/login?message=verification_incomplete`)
        }
      } else {
        // No session created, redirect to login
        return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
      }
    } catch (error) {
      console.error('Unexpected error during verification:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_failed`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}

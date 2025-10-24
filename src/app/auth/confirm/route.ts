import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/api/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/select-organization'

  console.log('token_hash:', token_hash)
  console.log('type:', type)
  console.log('next:', next)

  if (token_hash && type) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redirect user to specified redirect URL
      redirect(next)
    }

    console.error('Error verifying OTP:', error)
  } else {
    console.error('Invalid OTP verification parameters', token_hash, type)
  }

  // Redirect the user to an error page with instructions
  redirect('/auth/auth-code-error')
}
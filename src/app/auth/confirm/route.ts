import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api/server'
import { ensureAdminUserInfo } from '@/lib/supabase/api/ensure-admin-user-info'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')
  const isPkceToken = token_hash?.startsWith('pkce_') ?? false

  const getDefaultNextPath = () => {
    if (type === 'recovery') {
      return '/auth/reset-password'
    }
    return '/select-organization'
  }

  const normalizeNextPath = () => {
    const defaultNextPath = getDefaultNextPath()

    if (!next) {
      return defaultNextPath
    }

    try {
      const nextUrl = new URL(next, requestUrl.origin)
      if (nextUrl.origin !== requestUrl.origin) {
        return defaultNextPath
      }

      const normalizedPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      return normalizedPath || defaultNextPath
    } catch {
      return defaultNextPath
    }
  }

  const safeNextPath = normalizeNextPath()
  const isResetTarget = safeNextPath.startsWith('/auth/reset-password')

  if (token_hash && type) {
    const supabase = await createClient()
    const verificationTypes: EmailOtpType[] = [type]

    // Some Supabase email templates send PKCE recovery links as type=email.
    if (type === 'email' && isPkceToken && isResetTarget) {
      verificationTypes.push('recovery')
    }

    for (const verificationType of verificationTypes) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: verificationType,
        token_hash,
      })

      if (!error) {
        if (data?.user) {
          await ensureAdminUserInfo({
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata ?? undefined,
          })
        }
        return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin))
      }
    }
  } else {
    console.error('Invalid OTP verification parameters', token_hash, type)
  }

  return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
}

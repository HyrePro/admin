import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveSupabaseUser } from '@/lib/supabase/api/session-resolver'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { user: resolvedUser, error: resolvedAuthError } = await resolveSupabaseUser(supabase, {
    allowSessionFallback: true,
  })

  // Protected routes that require authentication
  const protectedPaths = ['/', '/jobs', '/settings', '/help', '/create-job-post']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )

  // Auth routes that should redirect if user is already logged in
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.includes(request.nextUrl.pathname)

  // Public routes that don't require authentication
  const publicPaths = ['/auth/callback', '/auth/reset-password']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If user is authenticated, check if they need to be redirected based on verification status and school_id
  if (resolvedUser) {
    // For the root path, we need to check if the user has a school_id
    if (request.nextUrl.pathname === '/') {
      try {
        // Check if user has school_id in admin_user_info
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', resolvedUser.id)
          .single()

        // If there's an error or no school_id, redirect to select-organization
        if (error || !data?.school_id) {
          return NextResponse.redirect(new URL('/select-organization', request.url))
        }
      } catch (error) {
        // If we can't determine school_id status, redirect to select-organization for safety
        return NextResponse.redirect(new URL('/select-organization', request.url))
      }
    }
    
    // If user is on auth pages and is logged in, redirect to dashboard
    if (isAuthPath) {
      const invitationToken = request.nextUrl.searchParams.get('invitation')
      if (invitationToken) {
        return NextResponse.redirect(new URL(`/invite/${encodeURIComponent(invitationToken)}`, request.url))
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirect logic for unauthenticated users
  if (isProtectedPath && !resolvedUser && !isPublicPath) {
    // If auth cookies exist, avoid hard-redirecting on transient failures.
    const hasAuthCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))

    if (hasAuthCookie && resolvedAuthError) {
      return supabaseResponse
    }

    // User is not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images in public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

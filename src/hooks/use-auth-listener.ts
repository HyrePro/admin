import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/api/server'
import { toast } from 'react-toastify'

export function useAuthListener() {
  const router = useRouter()

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabaseServer.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if email is confirmed
          if (session.user.email_confirmed_at) {
            console.log('Email confirmed, redirecting to dashboard')
            toast.success("Email confirmed! Redirecting to dashboard...")
            router.push("/")
          }
        }
        
        // Handle email confirmation specifically
        if (event === 'TOKEN_REFRESHED' && session?.user?.email_confirmed_at) {
          console.log('Email confirmed on token refresh, redirecting to dashboard')
          toast.success("Email confirmed! Redirecting to dashboard...")
          router.push("/")
        }
      }
    )

    // Check current session on mount
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabaseServer.auth.getSession()
        if (session?.user?.email_confirmed_at) {
          console.log('Current session has confirmed email, redirecting to dashboard')
          router.push("/")
        }
      } catch (error) {
        console.error('Error checking current session:', error)
      }
    }
    
    checkCurrentSession()

    // Handle page visibility changes (when user returns to tab)
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('Page became visible, checking auth status...')
        await checkCurrentSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Handle focus events (when user returns to window)
    const handleFocus = async () => {
      console.log('Window focused, checking auth status...')
      await checkCurrentSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [router])

  // Function to manually check auth status
  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabaseServer.auth.getSession()
      return session
    } catch (error) {
      console.error('Error checking auth status:', error)
      return null
    }
  }

  return { checkAuthStatus }
}

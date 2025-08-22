'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/api/client'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setIsAuthenticated(true)
        } else {
          // User is not authenticated, redirect to login
          router.replace('/login')
          return
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.replace('/login')
        return
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.replace('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <main className="min-h-screen flex items-center justify-center text-2xl font-bold">
        Authenticating...
      </main>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

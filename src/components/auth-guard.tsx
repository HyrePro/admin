'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/api/client'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasSchoolId, setHasSchoolId] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Create a Supabase client instance
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setIsAuthenticated(true)
          
          // Check if user has school_id
          try {
            const { data, error } = await supabase
              .from('admin_user_info')
              .select('school_id')
              .eq('id', session.user.id)
              .single()
            
            if (error) {
              console.error('Error fetching school info:', error)
              setHasSchoolId(false)
            } else {
              setHasSchoolId(!!data?.school_id)
            }
          } catch (error) {
            console.error('Error checking school ID:', error)
            setHasSchoolId(false)
          }
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
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.replace('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Handle redirect when user is authenticated but doesn't have school_id
  useEffect(() => {
    if (isAuthenticated && hasSchoolId === false) {
      router.replace('/select-organization')
    }
  }, [isAuthenticated, hasSchoolId, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <main className="min-h-screen flex items-center justify-center text-2xl font-bold">
      </main>
    )
  }

  // If user is authenticated but doesn't have school_id, show nothing while redirecting
  if (isAuthenticated && hasSchoolId === false) {
    return null
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
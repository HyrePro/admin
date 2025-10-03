'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading: authLoading } = useAuth()
  const { loading: redirectLoading, user, schoolId } = useAuthRedirect()
  const router = useRouter()

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute - Auth loading:', authLoading)
    console.log('ProtectedRoute - Redirect loading:', redirectLoading)
    console.log('ProtectedRoute - User:', user)
    console.log('ProtectedRoute - School ID:', schoolId)
  }, [authLoading, redirectLoading, user, schoolId])

  // If user is not authenticated, redirect to login (handled by middleware)
  // But we can show a loading state while checking
  if (authLoading || redirectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If we have a user and they've been processed by useAuthRedirect, render children
  // The useAuthRedirect hook will handle redirects based on the business logic
  return <>{children}</>
}
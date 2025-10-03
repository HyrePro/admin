'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/api/client'

export function useAuthRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { setUser, setSchoolId, schoolId } = useAuthStore()
  const isRedirecting = useRef(false)

  useEffect(() => {
    // Don't do anything if still loading
    if (loading) return

    // Update Zustand store with user
    setUser(user)

    // If no user, redirect to signup (but avoid redirect loops)
    if (!user && !isRedirecting.current) {
      // Check if we're already on auth pages to avoid redirect loops
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/signup'
      
      // Only redirect if we're not already on an auth page
      if (!isAuthPage) {
        isRedirecting.current = true
        router.replace('/signup')
        return
      }
    }

    // If we have a user, check their verification status and school_id
    if (user) {
      // Check if user is verified
      const isVerified = user.email_confirmed_at !== null
      
      // Don't redirect if user is on pages that don't require school_id
      const currentPath = window.location.pathname
      const isCreateSchoolPage = currentPath === '/create-school'
      const isSelectOrganizationPage = currentPath === '/select-organization'
      
      // If user is on a page that doesn't require school_id, don't redirect
      if (isCreateSchoolPage || isSelectOrganizationPage) {
        return
      }

      // If user is verified, fetch school_id from admin_user_info
      const fetchSchoolId = async () => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('admin_user_info')
            .select('school_id')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching school info:', error)
            setSchoolId(null)
            // If the user is verified but we can't fetch school info, redirect to select-organization
            if (isVerified) {
              isRedirecting.current = true
              router.replace('/select-organization')
            }
            return
          }

          const fetchedSchoolId = data?.school_id || null
          setSchoolId(fetchedSchoolId)

          // If user is verified but school_id is missing, redirect to select-organization
          if (isVerified && !fetchedSchoolId) {
            isRedirecting.current = true
            router.replace('/select-organization')
            return
          }

          // If user is logged in and school_id exists, redirect to dashboard
          if (isVerified && fetchedSchoolId) {
            isRedirecting.current = true
            router.replace('/')
            return
          }
        } catch (error) {
          console.error('Error in fetchSchoolId:', error)
          setSchoolId(null)
          // If there's an error but the user is verified, redirect to select-organization as a fallback
          if (isVerified) {
            isRedirecting.current = true
            router.replace('/select-organization')
          }
        }
      }

      // Only fetch school_id if user is verified
      if (isVerified) {
        fetchSchoolId()
      }
    }
  }, [user, loading, router, setUser, setSchoolId])

  // Return loading state and auth information
  return { loading, user, schoolId }
}
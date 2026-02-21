'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/api/client'
import { useAuthStore } from '@/store/auth-store'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const SESSION_REFRESH_INTERVAL_MS = 60_000
const SESSION_REFRESH_WINDOW_SECONDS = 5 * 60

function serializeUser(user: User): User {
  return JSON.parse(JSON.stringify(user)) as User
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setZustandUser } = useAuthStore()
  const initialUserRef = useRef<User | null>(initialUser)
  const isRefreshingRef = useRef(false)

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  const applySession = useCallback(
    (nextSession: Session | null) => {
      const serializedUser = nextSession?.user ? serializeUser(nextSession.user) : null
      setSession(nextSession)
      setUser(serializedUser)
      setZustandUser(serializedUser)
    },
    [setZustandUser]
  )

  const clearAuthState = useCallback(() => {
    setSession(null)
    setUser(null)
    setZustandUser(null)
  }, [setZustandUser])

  const refreshSessionIfNeeded = useCallback(
    async (forceRefresh = false, clearOnMissingSession = false) => {
      if (isRefreshingRef.current) return
      isRefreshingRef.current = true

      try {
        const supabase = supabaseRef.current!;
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!currentSession) {
          if (clearOnMissingSession) {
            clearAuthState()
          }
          return
        }

        const nowSeconds = Math.floor(Date.now() / 1000)
        const expiresAt = currentSession.expires_at ?? 0
        const shouldRefresh =
          forceRefresh || !expiresAt || expiresAt <= nowSeconds + SESSION_REFRESH_WINDOW_SECONDS

        if (!shouldRefresh) {
          return
        }

        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          if (currentSession.user) {
            applySession(currentSession)
            return
          }

          if (clearOnMissingSession) {
            clearAuthState()
          }
          return
        }

        applySession(data.session ?? currentSession)
      } catch (error) {
        console.error('Error refreshing session:', error)
        if (clearOnMissingSession) {
          clearAuthState()
        }
      } finally {
        isRefreshingRef.current = false
      }
    },
    [applySession, clearAuthState]
  )

  useEffect(() => {
    const supabase = supabaseRef.current!;
    let isMounted = true

    const initializeSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (initialSession?.user) {
          applySession(initialSession)
        } else if (initialUserRef.current) {
          const serializedInitialUser = serializeUser(initialUserRef.current)
          setUser(serializedInitialUser)
          setZustandUser(serializedInitialUser)
          await refreshSessionIfNeeded(true, false)
        } else {
          clearAuthState()
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (!initialUserRef.current) {
          clearAuthState()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void initializeSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT') {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (currentSession?.user) {
          applySession(currentSession)
        } else {
          clearAuthState()
        }
        setLoading(false)
        return
      }

      if (event === 'INITIAL_SESSION' && !nextSession && initialUserRef.current) {
        setLoading(false)
        return
      }

      if (nextSession?.user) {
        applySession(nextSession)
        setLoading(false)
        return
      }

      await refreshSessionIfNeeded(true, false)
      if (isMounted) {
        setLoading(false)
      }
    })

    const sessionInterval = window.setInterval(() => {
      void refreshSessionIfNeeded(false, false)
    }, SESSION_REFRESH_INTERVAL_MS)

    const handleWindowFocus = () => {
      void refreshSessionIfNeeded(false, false)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshSessionIfNeeded(false, false)
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.clearInterval(sessionInterval)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [applySession, clearAuthState, refreshSessionIfNeeded, setZustandUser])

  const contextValue = useMemo(() => ({ user, session, loading }), [user, session, loading])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

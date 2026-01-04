'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/api/client'
import { useAuthStore } from '@/store/auth-store'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setZustandUser } = useAuthStore()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Create a Supabase client instance
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession()
        
        // Serialize the user object to ensure it's a plain object
        const serializedUser = session?.user ? JSON.parse(JSON.stringify(session.user)) : null;
        setUser(serializedUser)
        setSession(session)
        setZustandUser(serializedUser)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        // Serialize the user object to ensure it's a plain object
        const serializedUser = session?.user ? JSON.parse(JSON.stringify(session.user)) : null;
        setUser(serializedUser)
        setSession(session)
        setZustandUser(serializedUser)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setZustandUser])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
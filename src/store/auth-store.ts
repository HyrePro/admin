import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  schoolId: string | null
  setUser: (user: User | null) => void
  setSchoolId: (schoolId: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  schoolId: null,
  setUser: (user) => set({ user }),
  setSchoolId: (schoolId) => set({ schoolId }),
  clearAuth: () => set({ user: null, schoolId: null }),
}))
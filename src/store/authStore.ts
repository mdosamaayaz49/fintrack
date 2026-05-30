import { create } from 'zustand'
import type { AppUser } from '@/types'

interface AuthState {
  currentUser: AppUser | null
  /** true while the Firebase onAuthStateChanged listener hasn't fired yet */
  loading: boolean
  setUser: (user: AppUser | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  loading: true,
  setUser: (user) => set({ currentUser: user, loading: false }),
  setLoading: (loading) => set({ loading }),
}))

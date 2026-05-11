import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/services/api'

export interface User {
  id: number
  email: string
  full_name: string
  role: 'trainee' | 'instructor' | 'admin'
  avatar_url?: string
  created_at: string
  is_onboarded: boolean
  email_verified?: boolean
  auth_provider?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; role?: string }) => Promise<{ message: string; requires_verification: boolean; email: string }>
  googleLogin: (credential: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  applyAuth: (accessToken: string, user: User) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
      isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false,
      isLoading: typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false,
      error: null,

      applyAuth: (accessToken: string, user: User) => {
        localStorage.setItem('access_token', accessToken)
        set({ user, token: accessToken, isAuthenticated: true, isLoading: false })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(email, password)
          const { access_token, user } = response.data
          get().applyAuth(access_token, user)
        } catch (error: unknown) {
          const err = error as { response?: { data?: { detail?: string } } }
          set({ 
            error: err.response?.data?.detail || 'Login failed', 
            isLoading: false 
          })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(data)
          set({ isLoading: false })
          return response.data
        } catch (error: unknown) {
          const err = error as { response?: { data?: { detail?: string } } }
          set({ 
            error: err.response?.data?.detail || 'Registration failed', 
            isLoading: false 
          })
          throw error
        }
      },

      googleLogin: async (credential: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.googleLogin({ credential })
          const { access_token, user } = response.data
          get().applyAuth(access_token, user)
        } catch (error: unknown) {
          const err = error as { response?: { data?: { detail?: string } } }
          set({
            error: err.response?.data?.detail || 'Google login failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      fetchUser: async () => {
        const token = get().token || localStorage.getItem('access_token')
        if (!token) {
          set({ isAuthenticated: false })
          return
        }
        
        set({ isLoading: true, token })
        try {
          const response = await authApi.me()
          set({ user: response.data, isAuthenticated: true, isLoading: false, token })
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          localStorage.removeItem('access_token')
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

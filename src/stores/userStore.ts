import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User } from '@/models/user'

// this is a not a very good implemention but it'll let you guys work smoothly because u can use the exported functions below
interface UserState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: User) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}
const backendurl = import.meta.env.VITE_BACKEND_URL
export const api = axios.create({
  baseURL: `${backendurl}`,
  withCredentials: true,
})
const sanitizeUserArray = (data: any): User[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if ('id' in data) return [data] // single user
  if (data.data) return sanitizeUserArray(data.data) // pagination case
  if (data.users) return sanitizeUserArray(data.users) // custom backend
  return []
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: true, error: null }),

      clearUser: () => set({ user: null, isAuthenticated: false, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post<User>('/auth/login', credentials)
          set({
            user: data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Login failed')
            : 'Login failed'
          set({ isLoading: false, error: message })
          throw err
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await api.post('/auth/logout')
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      fetchMe: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.get<User>('/users/me')
          set({ user: data, isAuthenticated: true, isLoading: false })
        } catch (err) {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
)
export const useUser = () => useUserStore((s) => s.user)
export const useIsAuthenticated = () => useUserStore((s) => s.isAuthenticated)
export const useIsAdmin = () => useUserStore((s) => s.user?.type === 'admin')
export const useAuthLoading = () => useUserStore((s) => s.isLoading)
export const useAuthError = () => useUserStore((s) => s.error)
export const initializeAuth = async () => {
  await useUserStore.getState().fetchMe()
}

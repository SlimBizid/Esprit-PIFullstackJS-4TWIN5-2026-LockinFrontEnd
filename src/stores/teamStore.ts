import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { Team } from '@/models/team'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
})

interface TeamState {
  teams: Team[]
  isLoading: boolean
  error: string | null

  fetchTeams: () => Promise<void>
  createTeam: (name: string, leaderId: string) => Promise<void>
  updateTeam: (id: number, name: string) => Promise<void>
  deleteTeam: (id: number) => Promise<void>
  inviteUser: (teamId: number, userId: string) => Promise<void>
  acceptInvitation: (teamId: number, userId: string) => Promise<void>
  declineInvitation: (teamId: number, userId: string) => Promise<void>
  removeUser: (teamId: number, userId: string) => Promise<void>
}

const sanitizeTeamArray = (data: any): Team[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if ('id' in data) return [data] // wrap single team into array
  return []
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: [],
      isLoading: false,
      error: null,

      fetchTeams: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.get('/teams')
          set({ teams: Array.isArray(data) ? data : [data] })
          set({ teams: sanitizeTeamArray(data), isLoading: false })
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to fetch teams'
            : 'Unknown error'
          set({ error: message, isLoading: false })
        }
      },

      createTeam: async (name, leaderId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/teams', { name, leaderId })
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          const newTeam = data && 'id' in data ? data : null
          if (newTeam) {
            set({ teams: [...currentTeams, newTeam], isLoading: false })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to create team'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      updateTeam: async (id, name) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.patch(`/teams/${id}`, { name })
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            set({
              teams: currentTeams.map((t) => (t.id === id ? updatedTeam : t)),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to update team'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      deleteTeam: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await api.delete(`/teams/${id}`)
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          set({
            teams: currentTeams.filter((t) => t.id !== id),
            isLoading: false,
          })
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to delete team'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      inviteUser: async (teamId, userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post(`/teams/${teamId}/invite/${userId}`)
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            set({
              teams: currentTeams.map((t) => (t.id === teamId ? updatedTeam : t)),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to invite user'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      acceptInvitation: async (teamId, userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post(`/teams/${teamId}/accept`, { userId })
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            set({
              teams: currentTeams.map((t) => (t.id === teamId ? updatedTeam : t)),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to accept invitation'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      declineInvitation: async (teamId, userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post(`/teams/${teamId}/decline`, { userId })
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            set({
              teams: currentTeams.map((t) => (t.id === teamId ? updatedTeam : t)),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to decline invitation'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      removeUser: async (teamId, userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.delete(`/teams/${teamId}/users/${userId}`)
          const currentTeams = Array.isArray(get().teams) ? get().teams : []
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            set({
              teams: currentTeams.map((t) => (t.id === teamId ? updatedTeam : t)),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to remove user'
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },
    }),
    {
      name: 'team-store',
      partialize: (state) => ({
        teams: Array.isArray(state.teams) ? state.teams : [],
      }),
    },
  ),
)

// selectors
export const useTeams = () => {
  const t = useTeamStore((s) => s.teams)
  return Array.isArray(t) ? t : []  // always array
}
export const useTeamLoading = () => useTeamStore((s) => s.isLoading)
export const useTeamError = () => useTeamStore((s) => s.error)

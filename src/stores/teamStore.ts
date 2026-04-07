import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { Team } from '@/models/team'
import { api } from '@/stores/userStore'

interface TeamState {
  // ✅ Two separate arrays
  allTeams: Team[]
  myTeams: Team[]
  isLoading: boolean
  error: string | null

  fetchTeams: () => Promise<void>
  fetchMyTeams: () => Promise<void>
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
  if ('id' in data) return [data]
  return []
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      allTeams: [],
      myTeams: [],
      isLoading: false,
      error: null,

      // fetch all teams (for Explore)
      fetchTeams: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.get('/teams')
          set({ allTeams: sanitizeTeamArray(data), isLoading: false })
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to fetch teams')
            : 'Unknown error'
          set({ error: message, isLoading: false })
        }
      },

      // fetch user's teams (for tabs)
      fetchMyTeams: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.get('/teams/my')
          set({ myTeams: sanitizeTeamArray(data), isLoading: false })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      },

      createTeam: async (name, leaderId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/teams', { name, leaderId })
          const newTeam = data && 'id' in data ? data : null
          if (newTeam) {
            // ✅ Add to both arrays
            set({
              allTeams: [...get().allTeams, newTeam],
              myTeams: [...get().myTeams, newTeam],
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to create team')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      updateTeam: async (id, name) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.patch(`/teams/${id}`, { name })
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            const updateArray = (arr: Team[]) =>
              arr.map((t) => (t.id === id ? updatedTeam : t))

            set({
              allTeams: updateArray(get().allTeams),
              myTeams: updateArray(get().myTeams),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to update team')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      deleteTeam: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await api.delete(`/teams/${id}`)
          const filterArray = (arr: Team[]) => arr.filter((t) => t.id !== id)
          set({
            allTeams: filterArray(get().allTeams),
            myTeams: filterArray(get().myTeams),
            isLoading: false,
          })
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to delete team')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      // All other actions can update only myTeams if needed
      inviteUser: async (teamId, userId) => {
  set({ isLoading: true, error: null })
  try {
    const { data } = await api.post(`/teams/${teamId}/invite`, { userId })
    const updatedTeam = data && 'id' in data ? data : null
    if (updatedTeam) {
      const updateArray = (arr: Team[]) =>
        arr.map((t) => (t.id === teamId ? updatedTeam : t))
      set({
        allTeams: updateArray(get().allTeams),
        myTeams: updateArray(get().myTeams),
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
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            const updateArray = (arr: Team[]) =>
              arr.map((t) => (t.id === teamId ? updatedTeam : t))
            set({
              allTeams: updateArray(get().allTeams),
              myTeams: updateArray(get().myTeams),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to accept invitation')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      declineInvitation: async (teamId, userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post(`/teams/${teamId}/decline`, {
            userId,
          })
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            const updateArray = (arr: Team[]) =>
              arr.map((t) => (t.id === teamId ? updatedTeam : t))
            set({
              allTeams: updateArray(get().allTeams),
              myTeams: updateArray(get().myTeams),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to decline invitation')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      removeUser: async (teamId, userId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.delete(`/teams/${teamId}/users/${userId}`)
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            const updateArray = (arr: Team[]) =>
              arr.map((t) => (t.id === teamId ? updatedTeam : t))
            set({
              allTeams: updateArray(get().allTeams),
              myTeams: updateArray(get().myTeams),
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to remove user')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },
    }),
    {
      name: 'team-store',
      partialize: (state) => ({
        allTeams: state.allTeams,
        myTeams: state.myTeams,
      }),
    },
  ),
)

// ✅ Selectors
export const useTeams = () => {
  const t = useTeamStore((s) => s.myTeams)
  return Array.isArray(t) ? t : []
}

export const useAllTeams = () => {
  const t = useTeamStore((s) => s.allTeams)
  return Array.isArray(t) ? t : []
}

export const useTeamLoading = () => useTeamStore((s) => s.isLoading)
export const useTeamError = () => useTeamStore((s) => s.error)

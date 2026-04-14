import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { Team } from '@/models/team'
import { api } from '@/stores/userStore'

const getPendingInvitationUserId = (invitation: any): string | undefined => {
  if (typeof invitation === 'string') return invitation
  return invitation?.userId ?? invitation?.user?.id
}

const removePendingInvitationFromTeams = (
  teams: Team[],
  teamId: number,
  userId: string,
): Team[] => {
  return teams.map((team) => {
    if (team.id !== teamId) return team

    return {
      ...team,
      pendingInvitations: (team.pendingInvitations ?? []).filter(
        (invitation) => getPendingInvitationUserId(invitation) !== userId,
      ),
    }
  })
}

interface TeamState {
  
  allTeams: Team[]
  myTeams: Team[]
  isLoading: boolean
  error: string | null
  message: string | null

  setMessage: (message: string | null) => void
  fetchTeams: () => Promise<void>
  fetchMyTeams: () => Promise<void>
  createTeam: (name: string, leaderId: string) => Promise<void>
  updateTeam: (id: number, name: string) => Promise<void>
  deleteTeam: (id: number) => Promise<void>
  inviteUser: (teamId: number, userId: string) => Promise<void>
  transferLeadership: (teamId: number, newLeaderId: string) => Promise<void>
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
      message: null,

      setMessage: (message) => set({ message }),

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
        if (get().myTeams.length > 0) {
          set({
            message:
              'You need to quit your current team to enter another team or create a new one.',
          })
          return
        }

        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/teams', { name, leaderId })
          const newTeam = data && 'id' in data ? data : null
          if (newTeam) {
            // ✅ Add to both arrays
            set({
              allTeams: [...get().allTeams, newTeam],
              myTeams: [...get().myTeams, newTeam],
              message: 'Yeyy! You created your own team.',
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
              message: 'Invitation sent.',
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to invite user')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      transferLeadership: async (teamId, newLeaderId) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.patch(`/teams/${teamId}`, {
            leaderId: newLeaderId,
          })
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            const updateArray = (arr: Team[]) =>
              arr.map((t) => (t.id === teamId ? updatedTeam : t))

            set({
              allTeams: updateArray(get().allTeams),
              myTeams: updateArray(get().myTeams),
              message: 'Leadership transferred successfully.',
              isLoading: false,
            })
          } else {
            set({ error: 'Invalid team data', isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to transfer leadership')
            : 'Unknown error'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      acceptInvitation: async (teamId, userId) => {
        if (get().myTeams.length > 0) {
          set({
            message:
              'You need to quit your current team to enter another team or create a new one.',
          })
          return
        }

        const previousAllTeams = get().allTeams
        const previousMyTeams = get().myTeams

        set({
          allTeams: removePendingInvitationFromTeams(
            previousAllTeams,
            teamId,
            userId,
          ),
          myTeams: removePendingInvitationFromTeams(
            previousMyTeams,
            teamId,
            userId,
          ),
          isLoading: true,
          error: null,
        })

        try {
          const { data } = await api.post(`/teams/${teamId}/accept`, { userId })
          const updatedTeam = data && 'id' in data ? data : null
          if (updatedTeam) {
            const updateArray = (arr: Team[]) =>
              arr.map((t) => (t.id === teamId ? updatedTeam : t))
            const hasTeamInMyTeams = get().myTeams.some((t) => t.id === teamId)
            set({
              allTeams: updateArray(get().allTeams),
              myTeams: hasTeamInMyTeams
                ? updateArray(get().myTeams)
                : [...get().myTeams, updatedTeam],
              message: 'Yeyy! You have been added to this team.',
              isLoading: false,
            })

            await get().fetchMyTeams()
          } else {
            set({ isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to accept invitation')
            : 'Unknown error'
          set({
            allTeams: previousAllTeams,
            myTeams: previousMyTeams,
            error: message,
            isLoading: false,
          })
          throw err
        }
      },

      declineInvitation: async (teamId, userId) => {
        const previousAllTeams = get().allTeams
        const previousMyTeams = get().myTeams

        set({
          allTeams: removePendingInvitationFromTeams(
            previousAllTeams,
            teamId,
            userId,
          ),
          myTeams: removePendingInvitationFromTeams(
            previousMyTeams,
            teamId,
            userId,
          ),
          isLoading: true,
          error: null,
        })

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
              message: 'Invitation declined.',
              isLoading: false,
            })
          } else {
            set({ isLoading: false })
          }
        } catch (err) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? 'Failed to decline invitation')
            : 'Unknown error'
          set({
            allTeams: previousAllTeams,
            myTeams: previousMyTeams,
            error: message,
            isLoading: false,
          })
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
              message: 'Oh no, a member has quit the team.',
              isLoading: false,
            })

            await get().fetchMyTeams()
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
export const useTeamMessage = () => useTeamStore((s) => s.message)

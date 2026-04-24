import { useQuery } from '@tanstack/react-query'

import type { Achievement } from '@/models/achievement'
import { api } from '@/stores/userStore'

export function useUserAchievements(username?: string) {
  return useQuery({
    queryKey: ['user-achievements', username],
    enabled: !!username,
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}/achievements`)
      return data as Achievement[]
    },
  })
}

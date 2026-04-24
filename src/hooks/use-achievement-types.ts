import { useQuery } from '@tanstack/react-query'

import type { AchievementType } from '@/models/achievement'
import { api } from '@/stores/userStore'

export function useAchievementTypes() {
  return useQuery({
    queryKey: ['achievement-types'],
    queryFn: async () => {
      const { data } = await api.get('/achievement/types')
      return data as AchievementType[]
    },
  })
}

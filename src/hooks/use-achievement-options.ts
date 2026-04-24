import { useQuery } from '@tanstack/react-query'

import { FETCH_LIMIT } from '@/components/cosmetics/query-constants'
import type { AchievementOption } from '@/models/cosmetics-shop'
import { api } from '@/stores/userStore'

export function useAchievementOptions(enabled: boolean) {
  return useQuery({
    queryKey: ['achievements', 'options'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/achievement', {
        params: { page: 1, limit: FETCH_LIMIT },
      })

      return (data as {
        data: AchievementOption[]
        total: number
        page: number
        lastPage: number
      }).data
    },
  })
}

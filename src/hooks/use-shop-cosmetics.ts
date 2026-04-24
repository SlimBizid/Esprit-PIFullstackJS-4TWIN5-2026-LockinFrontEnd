import { useQuery } from '@tanstack/react-query'

import { FETCH_LIMIT } from '@/components/cosmetics/query-constants'
import type { Cosmetic } from '@/models/cosmetic'
import { api } from '@/stores/userStore'

export function useShopCosmetics(enabled: boolean) {
  return useQuery({
    queryKey: ['cosmetics', 'shop'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/cosmetics/shop', {
        params: { page: 1, limit: FETCH_LIMIT },
      })

      return data as {
        data: Cosmetic[]
        total: number
        page: number
        lastPage: number
      }
    },
  })
}

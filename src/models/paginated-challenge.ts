import type { Challenge } from './challenge'

export type PaginatedChallenges = {
  data: Challenge[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

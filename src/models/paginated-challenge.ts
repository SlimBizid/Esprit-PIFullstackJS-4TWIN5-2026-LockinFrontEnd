import type { Challenge } from './challenge'

export type PaginatedChallenges = {
  challenges: Challenge[]
  total: number
  page: number
  lastPage: number
}

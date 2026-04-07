import type { User } from '@/models/user'

export type LeaderboardEntry = {
  id: string
  userId: string
  user: User
  totalScore: number
  challengeCompletions: number
  createdAt: string
  updatedAt: string
}

export type UserStanding = {
  scoreEntry: LeaderboardEntry
  scoreRank: number
  xpRank: number
  xp: number
}
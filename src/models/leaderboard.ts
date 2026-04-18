import type { User } from '@/models/user'

export enum Rank {
  IRON = 'IRON',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
  GRANDMASTER = 'GRANDMASTER',
}

export const RANK_THRESHOLDS: Record<Rank, { min: number; max: number }> = {
  [Rank.IRON]:        { min: 0,    max: 299  },
  [Rank.BRONZE]:      { min: 300,  max: 599  },
  [Rank.SILVER]:      { min: 600,  max: 999  },
  [Rank.GOLD]:        { min: 1000, max: 1499 },
  [Rank.PLATINUM]:    { min: 1500, max: 1999 },
  [Rank.DIAMOND]:     { min: 2000, max: 2999 },
  [Rank.MASTER]:      { min: 3000, max: 4999 },
  [Rank.GRANDMASTER]: { min: 5000, max: Infinity },
}

export const RANKS_ORDERED: Rank[] = [
  Rank.IRON,
  Rank.BRONZE,
  Rank.SILVER,
  Rank.GOLD,
  Rank.PLATINUM,
  Rank.DIAMOND,
  Rank.MASTER,
  Rank.GRANDMASTER,
]

export type ScoreLeaderboardItem = {
  userId: string
  totalScore: number
  challengeCompletions: number
  rank: Rank
  rankProgress: number
}

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
  scoreEntry: ScoreLeaderboardItem
  scoreRank: number
  rank: Rank
  rankProgress: number
  xpRank: number
  xp: number
}
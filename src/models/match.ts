import type { Challenge } from './challenge'

export type MatchSubmissionSummary = {
  id: string
  userId: string
  username: string | null
  language: string
  verdict:
    | 'accepted'
    | 'wrong_answer'
    | 'compilation_error'
    | 'runtime_error'
  passedCount: number
  totalCount: number
  createdAt: string
}

export type MatchMessage = {
  id: string
  matchId: string
  userId: string
  username: string | null
  content: string
  createdAt: string
}

export type Match = {
  id: string
  status: 'waiting' | 'active' | 'finished'
  visibility: 'private' | 'public'
  challenge: Pick<Challenge, 'id' | 'title' | 'difficulty' | 'type'>
  playerOne: {
    id: string
    username: string
  } | null
  playerTwo: {
    id: string
    username: string
  } | null
  winner: {
    id: string
    username: string
  } | null
  playerOneId: string
  playerTwoId: string | null
  winnerId: string | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
  canViewChallenge: boolean
  submissions: MatchSubmissionSummary[]
}

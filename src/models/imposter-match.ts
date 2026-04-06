import type { Challenge } from './challenge'

export type ImposterLobbySummary = {
  id: string
  challengeId: number
  visibility: 'private' | 'public'
  status: 'lobby' | 'active' | 'finished'
  maxPlayers: number
  playerCount: number
  isJoinedByCurrentUser: boolean
  host: {
    id: string
    username: string
  } | null
  createdAt: string
}

export type ImposterParticipantSummary = {
  userId: string
  username: string
  isHost: boolean
  hasVoted: boolean
  currentUserVoteTargetId: string | null
  latestSubmission: {
    id: string
    verdict:
      | 'accepted'
      | 'wrong_answer'
      | 'compilation_error'
      | 'runtime_error'
    passedCount: number
    totalCount: number
    language: string
    createdAt: string
  } | null
}

export type ImposterMatch = {
  id: string
  status: 'lobby' | 'active' | 'finished'
  visibility: 'private' | 'public'
  maxPlayers: number
  minimumPlayers: number
  challenge: Pick<Challenge, 'id' | 'title' | 'difficulty' | 'type'>
  host: {
    id: string
    username: string
  } | null
  currentUserRole: 'coder' | 'imposter' | null
  imposter: {
    id: string
    username: string
  } | null
  accusedPlayer: {
    id: string
    username: string
  } | null
  winningSide: 'coders' | 'imposter' | null
  acceptedSolver: {
    id: string
    username: string
  } | null
  participants: ImposterParticipantSummary[]
  playerCount: number
  votesIn: number
  canViewChallenge: boolean
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  updatedAt: string
}

export type PendingInvitation =
  | string
  | {
      userId?: string
      teamId?: number
      user?: {
        id?: string
        username?: string
      }
    }

export type Team = {
  pendingRequests: never[]
  id: number
  name: string
  teamCreationDate: string
  teamDeletionDate: string | null
  users: User[]
  leaderId:
    | string
    | {
        id?: string
        username?: string
      }
  pendingInvitations: PendingInvitation[]
  status: 'PENDING' | 'ACTIVE'
  challenges?: Array<{
    id: number
    title: string
    type: string
    difficulty: string
  }>
}

import type { User } from './user'

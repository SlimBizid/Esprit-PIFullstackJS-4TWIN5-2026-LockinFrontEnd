export type Team = {
  pendingRequests: never[]
  id: number
  name: string
  teamCreationDate: string
  teamDeletionDate: string | null
  users: User[]
  leaderId: string
  pendingInvitations: string[]
  status: 'PENDING' | 'ACTIVE'
}

import type { User } from './user'

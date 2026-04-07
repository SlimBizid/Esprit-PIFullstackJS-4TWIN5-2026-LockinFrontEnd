export type User = {
  id: string

  username: string

  githubHandle: string

  email: string

  type: UserType

  xp: number

  createdAt: Date

  updatedAt: Date
}

export enum UserType {
  ADMIN = 'admin',
  PLAYER = 'player',
}

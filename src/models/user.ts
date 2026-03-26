export type User = {
  id: string

  username: string

  githubHandle: string

  email: string

  type: UserType

  createdAt: Date

  updatedAt: Date
}

export enum UserType {
  ADMIN = 'admin',
  PLAYER = 'player',
}

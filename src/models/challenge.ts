export type Challenge = {
  id: number
  title: string
  content: string
  examples: string[]
  constraints: string[]
  conditions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'solo' | 'pvp' | 'teams'
  topics: string[]
  acceptanceRate: number
}

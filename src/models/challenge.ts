export type Challenge = {
  id: number
  challenge_title: string
  challenge_difficulty: 'easy' | 'medium' | 'hard'
  challenge_type: 'solo' | '1v1' | 'teams'
  topics: string[]
  challenge_acceptance_rate?: number
}

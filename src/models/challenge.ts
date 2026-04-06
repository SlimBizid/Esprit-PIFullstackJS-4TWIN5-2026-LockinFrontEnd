export type ChallengeCaseInput = {
  type: string
  value: string
}

export type ChallengeCase = {
  inputs: ChallengeCaseInput[]
  expectedOutput: string
}

export type Challenge = {
  id: number
  title: string
  content: string
  starterCode: string
  starterCodes: Partial<
    Record<'javascript' | 'typescript' | 'python' | 'java' | 'cpp', string>
  >
  examples: string[]
  constraints: string[]
  conditions: string[]
  cases: ChallengeCase[]
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'solo' | 'pvp' | 'teams' | 'imposter'
  topics: string[]
  acceptanceRate: number
}

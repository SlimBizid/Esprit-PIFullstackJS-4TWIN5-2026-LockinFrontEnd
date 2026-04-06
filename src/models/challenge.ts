export type ChallengeCaseInput = {
  type: string
  value: string
}

export type ChallengeCase = {
  inputs: ChallengeCaseInput[]
  expectedOutput: string
}

export type ChallengeQuizOption = {
  id: string
  text: string
}

export type ChallengeQuizQuestion = {
  id: string
  prompt: string
  options: ChallengeQuizOption[]
  correctOptionIds: string[]
  explanation?: string
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
  quizQuestions: ChallengeQuizQuestion[]
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'solo' | 'quiz' | 'pvp' | 'quiz_pvp' | 'teams' | 'imposter'
  topics: string[]
  acceptanceRate: number
}

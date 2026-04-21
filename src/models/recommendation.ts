export type RecommendedChallenge = {
  challengeId: number
  score: number
  rank: number
  reason: string
  challenge: {
    id: number
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    type:
      | 'solo'
      | 'quiz'
      | 'pvp'
      | 'quiz_pvp'
      | 'teams'
      | 'imposter'
      | 'thats_not_my_coder'
      | 'css_battle'
    topics: string[]
    acceptanceRate: number
  }
}

export type RecommendationResponse = {
  data: RecommendedChallenge[]
  meta: {
    modelVersion: string
    generatedAt: string | null
  }
}

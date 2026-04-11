export type PlagiarismFlagStatus = 'open' | 'reviewed' | 'dismissed'

export type PlagiarismFlag = {
  id: string
  challengeId: number
  challengeTitle: string
  challengeDifficulty: string
  challengeTopics: string[]
  language: string
  leftSubmissionId: string
  rightSubmissionId: string
  leftUserId: string
  rightUserId: string
  leftUsername: string
  rightUsername: string
  leftVerdict: string
  rightVerdict: string
  leftSourceCode: string
  rightSourceCode: string
  ruleScore: number
  anomalyScore: number
  suspicionScore: number
  normalizedSimilarity: number
  tokenJaccard: number
  ngramJaccard: number
  lengthRatio: number
  hoursGap: number
  reason: string
  modelVersion: string
  status: PlagiarismFlagStatus
  adminNotes: string | null
  reviewedByAdminId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

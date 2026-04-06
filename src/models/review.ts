export type ReviewAuthor = {
  id: string
  username: string
}

export type ReviewComment = {
  id: string
  reviewId: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  isDeleted: boolean
  hasReported: boolean
  canDelete: boolean
  author: ReviewAuthor | null
}

export type ChallengeReview = {
  id: string
  challengeId: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  isDeleted: boolean
  author: ReviewAuthor | null
  upvoteCount: number
  commentCount: number
  hasUpvoted: boolean
  hasReported: boolean
  canDelete: boolean
  comments: ReviewComment[]
}

export type ChallengeReviewList = {
  challengeId: number
  hasSubmitted: boolean
  canCreateReview: boolean
  userReviewId: string | null
  data: ChallengeReview[]
}

export type ReviewReport = {
  id: string
  targetType: 'review' | 'comment'
  reason: string
  details: string | null
  createdAt: string
  reporter: ReviewAuthor | null
  review: {
    id: string
    title: string
    content: string
    createdAt: string
    deletedAt: string | null
    isDeleted: boolean
    challenge: {
      id: number
      title: string
    } | null
    author: ReviewAuthor | null
    comments: ReviewComment[]
  } | null
  comment: ReviewComment | null
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Flag, Heart, MessageSquare, Shield, Trash2 } from 'lucide-react'
import axios from 'axios'

import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type {
  ChallengeReview,
  ChallengeReviewList,
  ReviewComment,
} from '@/models/review'
import { api, useIsAdmin } from '@/stores/userStore'

function formatReviewTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError(error)
    ? (error.response?.data?.message ?? fallback)
    : fallback
}

type ChallengeReviewsPanelProps = {
  challengeId: number
}

type ReportTarget =
  | { kind: 'review'; review: ChallengeReview }
  | { kind: 'comment'; review: ChallengeReview; comment: ReviewComment }

type DeleteTarget =
  | { kind: 'review'; review: ChallengeReview }
  | { kind: 'comment'; review: ChallengeReview; comment: ReviewComment }

export function ChallengeReviewsPanel({
  challengeId,
}: ChallengeReviewsPanelProps) {
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewContent, setReviewContent] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [reportDialogTarget, setReportDialogTarget] =
    useState<ReportTarget | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [messageDialog, setMessageDialog] = useState<MessageDialogState | null>(
    null,
  )

  const reviewsQuery = useQuery({
    queryKey: ['challenge-reviews', challengeId],
    queryFn: async () => {
      const { data } = await api.get<ChallengeReviewList>(
        `/challenges/${challengeId}/reviews`,
      )
      return data
    },
  })

  const reviews = reviewsQuery.data?.data ?? []

  const refreshReviews = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['challenge-reviews', challengeId],
    })
  }

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/challenges/${challengeId}/reviews`, {
        title: reviewTitle.trim(),
        content: reviewContent.trim(),
      })
    },
    onSuccess: async () => {
      setReviewTitle('')
      setReviewContent('')
      await refreshReviews()
    },
    onError: (error) => {
      const description = getErrorMessage(error, 'Failed to create review.')
      setMessageDialog({
        title: 'Review Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  const commentMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const content = commentDrafts[reviewId]?.trim() ?? ''
      await api.post(`/reviews/${reviewId}/comments`, { content })
    },
    onSuccess: async (_, reviewId) => {
      setCommentDrafts((current) => ({ ...current, [reviewId]: '' }))
      await refreshReviews()
    },
    onError: (error) => {
      const description = getErrorMessage(error, 'Failed to add comment.')
      setMessageDialog({
        title: 'Comment Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  const upvoteMutation = useMutation({
    mutationFn: async ({
      reviewId,
      hasUpvoted,
    }: {
      reviewId: string
      hasUpvoted: boolean
    }) => {
      if (hasUpvoted) {
        await api.delete(`/reviews/${reviewId}/upvote`)
        return
      }

      await api.post(`/reviews/${reviewId}/upvote`)
    },
    onSuccess: async () => {
      await refreshReviews()
    },
    onError: (error) => {
      const description = getErrorMessage(error, 'Failed to update upvote.')
      setMessageDialog({
        title: 'Upvote Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportDialogTarget) {
        throw new Error('No review selected.')
      }

      const payload = {
        reason: reportReason.trim(),
        details: reportDetails.trim() || undefined,
      }

      if (reportDialogTarget.kind === 'review') {
        await api.post(
          `/reviews/${reportDialogTarget.review.id}/report`,
          payload,
        )
        return
      }

      await api.post(
        `/review-comments/${reportDialogTarget.comment.id}/report`,
        payload,
      )
    },
    onSuccess: async () => {
      setReportDialogTarget(null)
      setReportReason('')
      setReportDetails('')
      await refreshReviews()
    },
    onError: (error) => {
      const description = getErrorMessage(error, 'Failed to submit report.')
      setMessageDialog({
        title: 'Report Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  const deleteReviewMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      if (target.kind === 'review') {
        await api.delete(`/reviews/${target.review.id}`)
        return
      }

      await api.delete(`/review-comments/${target.comment.id}`)
    },
    onSuccess: async () => {
      setDeleteTarget(null)
      await refreshReviews()
    },
    onError: (error) => {
      const description = getErrorMessage(error, 'Failed to delete content.')
      setMessageDialog({
        title: 'Delete Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  return (
    <>
      <div className="space-y-4">
        <Card className="gap-4 py-4 rounded-none">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">Challenge Reviews</CardTitle>
                <CardDescription>
                  People who actually submitted code can leave a review. Anyone
                  signed in can comment, upvote, and report reviews.
                </CardDescription>
              </div>
              {isAdmin ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                >
                  <Link to="/admin/review-reports">Review Reports</Link>
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-none" variant="secondary">
                {reviews.length} reviews
              </Badge>
              {reviewsQuery.data?.hasSubmitted ? (
                <Badge className="rounded-none" variant="outline">
                  Submitted
                </Badge>
              ) : (
                <Badge className="rounded-none" variant="outline">
                  No submission yet
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {reviewsQuery.isLoading ? (
          <Card className="py-4">
            <CardContent className="text-sm text-muted-foreground">
              Loading reviews...
            </CardContent>
          </Card>
        ) : null}

        {reviewsQuery.data && reviewsQuery.data.canCreateReview ? (
          <Card className="gap-4 py-4 rounded-none">
            <CardHeader className="gap-1">
              <CardTitle className="text-base">Leave a Review</CardTitle>
              <CardDescription>
                Share what worked, what was tricky, and whether the challenge
                felt fair.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="challenge-review-title">Review title</Label>
                <Input
                  className="rounded-none"
                  id="challenge-review-title"
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="Clear title for your review"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="challenge-review-content">Review</Label>
                <textarea
                  id="challenge-review-content"
                  value={reviewContent}
                  onChange={(event) => setReviewContent(event.target.value)}
                  className="rounded-none min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="What did you think about the prompt, tests, and difficulty?"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                className="rounded-none"
                type="button"
                disabled={
                  createReviewMutation.isPending ||
                  reviewTitle.trim().length < 3 ||
                  reviewContent.trim().length < 10
                }
                onClick={() => createReviewMutation.mutate()}
              >
                {createReviewMutation.isPending ? 'Posting...' : 'Post review'}
              </Button>
            </CardFooter>
          </Card>
        ) : reviewsQuery.data ? (
          <Alert className="rounded-none">
            <Shield className="h-4 w-4" />
            <AlertTitle>Review Access</AlertTitle>
            <AlertDescription>
              {reviewsQuery.data.hasSubmitted
                ? 'You already reviewed this challenge.'
                : 'Submit a solution first to unlock review posting.'}
            </AlertDescription>
          </Alert>
        ) : null}

        {reviews.length === 0 && !reviewsQuery.isLoading ? (
          <Card className="py-4 rounded-none">
            <CardContent className="text-sm text-muted-foreground">
              No reviews yet. The first submitted solution can set the tone.
            </CardContent>
          </Card>
        ) : null}

        {reviews.map((review) => {
          const commentDraft = commentDrafts[review.id] ?? ''
          const isMutatingComment =
            commentMutation.isPending && commentMutation.variables === review.id
          const isMutatingDelete =
            deleteReviewMutation.isPending &&
            deleteReviewMutation.variables?.kind === 'review' &&
            deleteReviewMutation.variables.review.id === review.id
          const isMutatingUpvote =
            upvoteMutation.isPending &&
            upvoteMutation.variables?.reviewId === review.id

          return (
            <Card key={review.id} className="gap-4 py-4 rounded-none">
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{review.title}</CardTitle>
                    <CardDescription>
                      {review.author?.username ?? 'Unknown user'} ·{' '}
                      {formatReviewTime(review.createdAt)}
                      {review.isDeleted ? ' · deleted' : ''}
                    </CardDescription>
                  </div>
                  {review.canDelete && !review.isDeleted ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="rounded-none"
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({ kind: 'review', review })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete this review</TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {review.content}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="rounded-none"
                        type="button"
                        variant={review.hasUpvoted ? 'default' : 'outline'}
                        size="sm"
                        disabled={isMutatingUpvote || review.isDeleted}
                        onClick={() =>
                          upvoteMutation.mutate({
                            reviewId: review.id,
                            hasUpvoted: review.hasUpvoted,
                          })
                        }
                      >
                        <Heart className="h-4 w-4" />
                        {review.hasUpvoted ? 'Upvoted' : 'Upvote'} (
                        {review.upvoteCount})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {review.hasUpvoted
                        ? 'Remove your upvote'
                        : 'Upvote this review'}
                    </TooltipContent>
                  </Tooltip>

                  <Badge variant="secondary">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {review.commentCount} comments
                  </Badge>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="rounded-none"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReportDialogTarget({ kind: 'review', review })
                        }
                        disabled={review.hasReported || review.isDeleted}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {review.hasReported
                        ? 'You already reported this review'
                        : 'Report this review to admins'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="space-y-3 rounded-xl ">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Comments
                  </div>
                  {review.comments.length > 0 ? (
                    review.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className=" border border-border/70 bg-background/70 p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <div className="text-xs text-muted-foreground">
                            {comment.author?.username ?? 'Unknown user'} ·{' '}
                            {formatReviewTime(comment.createdAt)}
                            {comment.isDeleted ? ' · deleted' : ''}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {comment.canDelete && !comment.isDeleted ? (
                              <Button
                                className="rounded-none"
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'comment',
                                    review,
                                    comment,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                {deleteReviewMutation.isPending &&
                                deleteReviewMutation.variables?.kind ===
                                  'comment' &&
                                deleteReviewMutation.variables.comment.id ===
                                  comment.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </Button>
                            ) : null}
                            <Button
                              className="rounded-none"
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setReportDialogTarget({
                                  kind: 'comment',
                                  review,
                                  comment,
                                })
                              }
                              disabled={
                                comment.hasReported || comment.isDeleted
                              }
                            >
                              <Flag className="h-4 w-4" />
                              {comment.hasReported ? 'Reported' : 'Report'}
                            </Button>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No comments yet.
                    </p>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor={`review-comment-${review.id}`}>
                      Add a comment
                    </Label>
                    <textarea
                      id={`review-comment-${review.id}`}
                      value={commentDraft}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [review.id]: event.target.value,
                        }))
                      }
                      className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      placeholder={
                        review.isDeleted
                          ? 'Deleted reviews cannot receive new comments.'
                          : 'Add context, ask a question, or agree with the review.'
                      }
                      disabled={review.isDeleted}
                    />
                    <div className="flex justify-end">
                      <Button
                        className="rounded-none"
                        type="button"
                        size="sm"
                        disabled={
                          isMutatingComment ||
                          !commentDraft.trim() ||
                          review.isDeleted
                        }
                        onClick={() => commentMutation.mutate(review.id)}
                      >
                        {isMutatingComment ? 'Posting...' : 'Post comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between text-xs text-muted-foreground">
                <span>
                  {review.upvoteCount} upvotes · {review.commentCount} comments
                </span>
                {isMutatingDelete ? <span>Deleting...</span> : null}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={!!reportDialogTarget}
        onOpenChange={(open) => {
          if (!open) {
            setReportDialogTarget(null)
            setReportReason('')
            setReportDetails('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Report{' '}
              {reportDialogTarget?.kind === 'comment' ? 'Comment' : 'Review'}
            </DialogTitle>
            <DialogDescription>
              Explain why this{' '}
              {reportDialogTarget?.kind === 'comment' ? 'comment' : 'review'}{' '}
              should be reviewed by an admin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="review-report-reason">Reason</Label>
              <Input
                id="review-report-reason"
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Spam, abuse, spoilers, harassment..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-report-details">Details</Label>
              <textarea
                id="review-report-details"
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="Optional extra context for moderators."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="rounded-none"
              type="button"
              variant="outline"
              onClick={() => {
                setReportDialogTarget(null)
                setReportReason('')
                setReportDetails('')
              }}
              disabled={reportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none"
              type="button"
              variant="destructive"
              disabled={
                reportMutation.isPending || reportReason.trim().length < 3
              }
              onClick={() => reportMutation.mutate()}
            >
              {reportMutation.isPending ? 'Sending...' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title={
          deleteTarget?.kind === 'comment' ? 'Delete Comment' : 'Delete Review'
        }
        description={
          deleteTarget?.kind === 'comment'
            ? 'Delete this comment? It will remain visible as deleted.'
            : `Delete “${
                deleteTarget?.kind === 'review'
                  ? deleteTarget.review.title
                  : 'this review'
              }”? It will remain visible as deleted.`
        }
        confirmLabel={
          deleteTarget?.kind === 'comment' ? 'Delete comment' : 'Delete review'
        }
        confirmVariant="destructive"
        isPending={deleteReviewMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteReviewMutation.mutate(deleteTarget)
          }
        }}
      />

      <MessageDialog
        message={messageDialog}
        onOpenChange={(open) => {
          if (!open) {
            setMessageDialog(null)
          }
        }}
      />
    </>
  )
}

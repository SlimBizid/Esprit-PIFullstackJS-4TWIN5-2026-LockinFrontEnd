import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Flag, MessageSquare, Shield, Trash2 } from 'lucide-react'
import axios from 'axios'
import { useState } from 'react'

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
import type { ReviewReport } from '@/models/review'
import { api, useIsAdmin } from '@/stores/userStore'

function formatReportTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const Route = createFileRoute('/admin/review-reports')({
  component: RouteComponent,
})

function RouteComponent() {
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const [messageDialog, setMessageDialog] = useState<MessageDialogState | null>(
    null,
  )
  const [targetReport, setTargetReport] = useState<ReviewReport | null>(null)
  const [deleteMode, setDeleteMode] = useState<
    'report' | 'review' | 'comment' | null
  >(null)

  const reportsQuery = useQuery({
    queryKey: ['review-reports'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ReviewReport[]>('/reviews/reports')
      return data
    },
  })

  const refreshReports = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['review-reports'],
    })
  }

  const dismissReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/reviews/reports/${reportId}`)
    },
    onSuccess: async () => {
      setTargetReport(null)
      setDeleteMode(null)
      await refreshReports()
    },
    onError: (error) => {
      const description = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to dismiss report.')
        : 'Failed to dismiss report.'
      setMessageDialog({
        title: 'Dismiss Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  const deleteReviewMutation = useMutation({
    mutationFn: async ({
      type,
      id,
    }: {
      type: 'review' | 'comment'
      id: string
    }) => {
      if (type === 'review') {
        await api.delete(`/reviews/${id}`)
        return
      }

      await api.delete(`/review-comments/${id}`)
    },
    onSuccess: async () => {
      setTargetReport(null)
      setDeleteMode(null)
      await refreshReports()
    },
    onError: (error) => {
      const description = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to delete review.')
        : 'Failed to delete review.'
      setMessageDialog({
        title: 'Delete Failed',
        description,
        variant: 'destructive',
      })
    },
  })

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 pb-16 pt-28">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Admin Only</AlertTitle>
          <AlertDescription>
            Review moderation is only available to admins.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 pt-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline">Admin moderation</Badge>
            <h1 className="text-3xl font-black tracking-tight">
              Review Reports
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Review flagged challenge feedback, remove malicious content, or
              dismiss false positives.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/challenges">Back to challenges</Link>
          </Button>
        </div>

        {reportsQuery.isLoading ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading reports...
            </CardContent>
          </Card>
        ) : null}

        {!reportsQuery.isLoading && (reportsQuery.data?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No review reports are waiting for moderation.
            </CardContent>
          </Card>
        ) : null}

        {reportsQuery.data?.map((report) => (
          <Card key={report.id} className="gap-4">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {report.targetType === 'comment' ? (
                      <MessageSquare className="h-4 w-4 text-destructive" />
                    ) : (
                      <Flag className="h-4 w-4 text-destructive" />
                    )}
                    {report.reason}
                  </CardTitle>
                  <CardDescription>
                    Reported by {report.reporter?.username ?? 'Unknown user'} on{' '}
                    {formatReportTime(report.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTargetReport(report)
                      setDeleteMode('report')
                    }}
                  >
                    Dismiss report
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setTargetReport(report)
                      setDeleteMode(
                        report.targetType === 'comment' ? 'comment' : 'review',
                      )
                    }}
                    disabled={
                      deleteMode === 'comment' ? !report.comment : !report.review
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete {report.targetType}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.details ? (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Reporter details</AlertTitle>
                  <AlertDescription>{report.details}</AlertDescription>
                </Alert>
              ) : null}

              <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {report.targetType === 'comment'
                    ? 'Reported comment'
                    : 'Target review'}
                </div>
                {report.targetType === 'comment' && report.comment ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Comment author: {report.comment.author?.username ?? 'Unknown user'}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {report.comment.content}
                    </p>
                  </div>
                ) : report.review ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">
                      {report.review.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Challenge:{' '}
                      {report.review.challenge ? (
                        <Link
                          to="/challenge"
                          search={{ id: report.review.challenge.id }}
                          className="underline-offset-4 hover:underline"
                        >
                          {report.review.challenge.title}
                        </Link>
                      ) : (
                        'Unknown challenge'
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Author: {report.review.author?.username ?? 'Unknown user'}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {report.review.content}
                    </p>
                    <div className="space-y-2 rounded-lg border border-border/60 bg-background/70 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Thread comments
                      </div>
                      {report.review.comments.length > 0 ? (
                        report.review.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-md border border-border/60 bg-muted/20 p-3"
                          >
                            <div className="mb-1 text-xs text-muted-foreground">
                              {comment.author?.username ?? 'Unknown user'} ·{' '}
                              {formatReportTime(comment.createdAt)}
                              {comment.isDeleted ? ' · deleted' : ''}
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No comments on this review.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The review tied to this report is no longer available.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end text-xs text-muted-foreground">
              Report ID: {report.id}
            </CardFooter>
          </Card>
        ))}
      </main>

      <ConfirmDialog
        open={!!targetReport && !!deleteMode}
        onOpenChange={(open) => {
          if (!open) {
            setTargetReport(null)
            setDeleteMode(null)
          }
        }}
        title={
          deleteMode === 'review'
            ? 'Delete Review'
            : deleteMode === 'comment'
              ? 'Delete Comment'
              : 'Dismiss Review Report'
        }
        description={
          deleteMode === 'review'
            ? `Delete “${targetReport?.review?.title ?? 'this review'}”?`
            : deleteMode === 'comment'
              ? 'Delete this comment? It will remain visible as deleted.'
            : 'Dismiss this report and remove it from the moderation queue?'
        }
        confirmLabel={
          deleteMode === 'review'
            ? 'Delete review'
            : deleteMode === 'comment'
              ? 'Delete comment'
              : 'Dismiss report'
        }
        confirmVariant={
          deleteMode === 'review' || deleteMode === 'comment'
            ? 'destructive'
            : 'default'
        }
        isPending={
          dismissReportMutation.isPending || deleteReviewMutation.isPending
        }
        onConfirm={() => {
          if (!targetReport || !deleteMode) {
            return
          }

          if (deleteMode === 'review') {
            if (targetReport.review) {
              deleteReviewMutation.mutate({
                type: 'review',
                id: targetReport.review.id,
              })
            }
            return
          }

          if (deleteMode === 'comment') {
            if (targetReport.comment) {
              deleteReviewMutation.mutate({
                type: 'comment',
                id: targetReport.comment.id,
              })
            }
            return
          }

          dismissReportMutation.mutate(targetReport.id)
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

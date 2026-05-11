import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Code2,
  Flag,
  MessageSquare,
  Shield,
  Trash2,
} from 'lucide-react'
import axios from 'axios'
import { useMemo, useState } from 'react'

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
import { Progress } from '@/components/ui/progress'
import type { ReviewReport } from '@/models/review'
import { api, useIsAdmin } from '@/stores/userStore'

const PLAGIARISM_SAMPLE_LEFT = `function maxProfit(prices) {
  let min = Infinity
  let best = 0

  for (const price of prices) {
    min = Math.min(min, price)
    best = Math.max(best, price - min)
  }

  return best
}`

const PLAGIARISM_SAMPLE_RIGHT = `function maxGain(values) {
  let cheapest = Infinity
  let answer = 0

  for (const value of values) {
    cheapest = Math.min(cheapest, value)
    answer = Math.max(answer, value - cheapest)
  }

  return answer
}`

const PLAGIARISM_FLAG_THRESHOLD = 0.82

const COMMON_KEYWORDS = new Set([
  'if',
  'else',
  'for',
  'while',
  'return',
  'class',
  'function',
  'def',
  'const',
  'let',
  'var',
  'public',
  'private',
  'protected',
  'static',
  'void',
  'int',
  'float',
  'double',
  'boolean',
  'bool',
  'string',
  'true',
  'false',
  'null',
  'none',
  'this',
  'new',
  'switch',
  'case',
  'break',
  'continue',
  'try',
  'catch',
  'finally',
  'import',
  'from',
  'include',
  'using',
  'namespace',
  'lambda',
])

function stripCodeComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/#.*$/gm, ' ')
}

function normalizeCode(source: string) {
  const code = stripCodeComments(source ?? '')
    .replace(/"(?:\\.|[^"\\])*"/g, ' STR ')
    .replace(/'(?:\\.|[^'\\])*'/g, ' STR ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' NUM ')

  const tokens = code.match(
    /[A-Za-z_][A-Za-z0-9_]*|==|!=|<=|>=|&&|\|\||[-+*/%<>{}()\[\],.;:=]/g,
  )

  if (!tokens) {
    return ''
  }

  return tokens
    .map((token) => {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
        const lower = token.toLowerCase()
        return COMMON_KEYWORDS.has(lower) ? lower : 'VAR'
      }

      return token
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(normalizedCode: string) {
  return normalizedCode ? normalizedCode.split(' ') : []
}

function buildNgrams(tokens: string[], size = 3) {
  if (tokens.length < size) {
    return new Set(tokens.length ? [tokens.join(' ')] : [])
  }

  const ngrams = new Set<string>()

  for (let index = 0; index <= tokens.length - size; index += 1) {
    ngrams.add(tokens.slice(index, index + size).join(' '))
  }

  return ngrams
}

function jaccardSimilarity(left: Iterable<string>, right: Iterable<string>) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)

  if (!leftSet.size && !rightSet.size) {
    return 0
  }

  const intersection = [...leftSet].filter((value) => rightSet.has(value))
  const union = new Set([...leftSet, ...rightSet])

  return intersection.length / union.size
}

function sequenceSimilarity(left: string, right: string) {
  if (!left && !right) {
    return 0
  }

  let matches = 0
  const longest = Math.max(left.length, right.length)

  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] === right[index]) {
      matches += 1
    }
  }

  return longest === 0 ? 0 : matches / longest
}

function calculatePlagiarismScore(leftCode: string, rightCode: string) {
  const normalizedLeft = normalizeCode(leftCode)
  const normalizedRight = normalizeCode(rightCode)

  const leftTokens = tokenize(normalizedLeft)
  const rightTokens = tokenize(normalizedRight)

  const rawSimilarity = sequenceSimilarity(leftCode, rightCode)
  const normalizedSimilarity = sequenceSimilarity(
    normalizedLeft,
    normalizedRight,
  )
  const tokenJaccard = jaccardSimilarity(leftTokens, rightTokens)
  const ngramJaccard = jaccardSimilarity(
    buildNgrams(leftTokens),
    buildNgrams(rightTokens),
  )
  const lengthRatio =
    !leftCode.length || !rightCode.length
      ? 0
      : Math.min(leftCode.length, rightCode.length) /
        Math.max(leftCode.length, rightCode.length)

  const score =
    0.15 * rawSimilarity +
    0.35 * normalizedSimilarity +
    0.25 * tokenJaccard +
    0.25 * ngramJaccard

  return {
    score: Math.min(Math.max(score, 0), 1),
    rawSimilarity,
    normalizedSimilarity,
    tokenJaccard,
    ngramJaccard,
    lengthRatio,
    normalizedLeft,
    normalizedRight,
  }
}

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
  const [plagiarismLeftCode, setPlagiarismLeftCode] = useState(
    PLAGIARISM_SAMPLE_LEFT,
  )
  const [plagiarismRightCode, setPlagiarismRightCode] = useState(
    PLAGIARISM_SAMPLE_RIGHT,
  )

  const plagiarismScore = useMemo(
    () => calculatePlagiarismScore(plagiarismLeftCode, plagiarismRightCode),
    [plagiarismLeftCode, plagiarismRightCode],
  )
  const plagiarismPercentage = Math.round(plagiarismScore.score * 10000) / 100
  const isPlagiarismSuspicious =
    plagiarismScore.score >= PLAGIARISM_FLAG_THRESHOLD
  const plagiarismBadgeLabel = isPlagiarismSuspicious
    ? 'Suspicious pair'
    : 'Low risk'

  const showPlagiarismAction = (action: 'escalate' | 'dismiss' | 'warn') => {
    if (action === 'escalate') {
      setMessageDialog({
        title: 'Escalated for Review',
        description:
          'The pair would be routed to manual moderation with the current similarity evidence attached.',
        variant: 'default',
      })
      return
    }

    if (action === 'warn') {
      setMessageDialog({
        title: 'Warnings Prepared',
        description:
          'Both users would receive a plagiarism warning message in the real workflow.',
        variant: 'default',
      })
      return
    }

    setMessageDialog({
      title: 'Dismissed as False Positive',
      description:
        'The pair would be removed from the queue and kept for audit only.',
      variant: 'default',
    })
  }

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
            <Badge variant="outline">Plagiarism detection</Badge>
            <h1 className="text-3xl font-black tracking-tight">
              Code Similarity Dashboard
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/challenges">Back to challenges</Link>
          </Button>
        </div>

        <Card className="border-primary/15 bg-linear-to-br from-background to-muted/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Detected Plagiarism
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Submission A
                </div>
                <textarea
                  className="min-h-64 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={plagiarismLeftCode}
                  onChange={(event) =>
                    setPlagiarismLeftCode(event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Submission B
                </div>
                <textarea
                  className="min-h-64 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={plagiarismRightCode}
                  onChange={(event) =>
                    setPlagiarismRightCode(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Similarity score
                </div>
                <div className="mt-2 text-3xl font-black tracking-tight">
                  {plagiarismPercentage.toFixed(2)}%
                </div>
                <Progress className="mt-3" value={plagiarismPercentage} />
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Detection verdict
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant={
                      isPlagiarismSuspicious ? 'destructive' : 'secondary'
                    }
                  >
                    {plagiarismBadgeLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Threshold: {Math.round(PLAGIARISM_FLAG_THRESHOLD * 100)}%.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Normalized overlap
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Token Jaccard:{' '}
                  <span className="font-medium text-foreground">
                    {(plagiarismScore.tokenJaccard * 100).toFixed(2)}%
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  N-gram Jaccard:{' '}
                  <span className="font-medium text-foreground">
                    {(plagiarismScore.ngramJaccard * 100).toFixed(2)}%
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Reviewer guidance
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use this score as a moderation signal, then verify the
                  submissions manually before taking action.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/70 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Suggested actions for this report
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={isPlagiarismSuspicious ? 'destructive' : 'default'}
                  onClick={() => showPlagiarismAction('escalate')}
                >
                  Mark as plagiarism
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => showPlagiarismAction('warn')}
                >
                  Warn both users
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => showPlagiarismAction('dismiss')}
                >
                  Dismiss as false positive
                </Button>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Recommended decision:{' '}
                <span className="font-medium text-foreground">
                  {isPlagiarismSuspicious
                    ? 'Escalate to manual moderation'
                    : 'Keep for audit and dismiss if approved'}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Raw match
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {(plagiarismScore.rawSimilarity * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Normalized match
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {(plagiarismScore.normalizedSimilarity * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Size ratio
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {(plagiarismScore.lengthRatio * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/review-reports">Open report queue</Link>
            </Button>
          </CardFooter>
        </Card>

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
                      deleteMode === 'comment'
                        ? !report.comment
                        : !report.review
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
                      Comment author:{' '}
                      {report.comment.author?.username ?? 'Unknown user'}
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

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Terminal,
  ChevronLeft,
  Play,
  Send,
  ShieldCheck,
  AlertCircle,
  Code2,
  Swords,
  MessageCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Editor, loader } from '@monaco-editor/react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api, useIsAuthenticated, useUser } from '@/stores/userStore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ChallengeReviewsPanel } from '@/components/challenge-reviews-panel'
import { Input } from '@/components/ui/input'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import type { Challenge } from '@/models/challenge'
import type { EditorLanguage } from '@/models/editor-language'
import type { Match, MatchMessage } from '@/models/match'
import type { TestResult } from '@/models/test-result'
import { LANGUAGE_FILE_EXTENSIONS } from '@/models/language-file-extensions'
import { LANGUAGE_LABELS } from '@/models/lagnuage-labels'

const challengeSearchSchema = z.object({
  id: z.coerce.number().int().positive(),
  matchId: z.string().uuid().optional(),
})

function formatDifficulty(difficulty: Challenge['difficulty']) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function getStarterCode() {
  return [
    'function solution(...args) {',
    '  // Implement your answer here.',
    '  return args',
    '}',
  ].join('\n')
}

function getStarterCodeForLanguage(
  language: EditorLanguage,
  challenge?: Challenge,
) {
  const backendStarterCode =
    challenge?.starterCodes?.[language]?.trim() ||
    (language === 'javascript' ? challenge?.starterCode?.trim() : '')

  if (backendStarterCode) {
    return backendStarterCode
  }

  switch (language) {
    case 'typescript':
      return [
        'function solution(...args: unknown[]): unknown {',
        '  // Implement your answer here.',
        '  return args',
        '}',
      ].join('\n')
    case 'python':
      return [
        'def solution(*args):',
        '    # Implement your answer here.',
        '    return args',
      ].join('\n')
    case 'java':
      return [
        'class Solution {',
        '    public Object solution(Object... args) {',
        '        // Implement your answer here.',
        '        return args;',
        '    }',
        '}',
      ].join('\n')
    case 'cpp':
      return [
        'class Solution {',
        'public:',
        '    JsonValue solution(const std::vector<JsonValue>& args) {',
        '        // Implement your answer here.',
        '        return args.empty() ? JsonValue(nullptr) : args[0];',
        '    }',
        '};',
      ].join('\n')
    case 'javascript':
    default:
      return backendStarterCode || getStarterCode()
  }
}

function getInitialCode(challenge?: Challenge) {
  return getStarterCodeForLanguage('javascript', challenge)
}

function buildCodeByLanguage(
  challenge?: Challenge,
): Record<EditorLanguage, string> {
  return {
    javascript: getInitialCode(challenge),
    typescript: getStarterCodeForLanguage('typescript', challenge),
    python: getStarterCodeForLanguage('python', challenge),
    java: getStarterCodeForLanguage('java', challenge),
    cpp: getStarterCodeForLanguage('cpp', challenge),
  }
}

function getEditorPath(id: number, language: EditorLanguage) {
  return `challenge-${id}/solution.${LANGUAGE_FILE_EXTENSIONS[language]}`
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const Route = createFileRoute('/challenge')({
  validateSearch: challengeSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { id, matchId } = Route.useSearch()
  const queryClient = useQueryClient()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const { theme } = useTheme()
  const [selectedLanguage, setSelectedLanguage] =
    useState<EditorLanguage>('javascript')
  const [codeByLanguage, setCodeByLanguage] =
    useState<Record<EditorLanguage, string>>(buildCodeByLanguage)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'content' | 'reviews' | 'chat'
  >('content')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinMatchId, setJoinMatchId] = useState('')
  const [chatDraft, setChatDraft] = useState('')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [messageDialog, setMessageDialog] = useState<MessageDialogState | null>(
    null,
  )
  const [matchResultDialog, setMatchResultDialog] =
    useState<MessageDialogState | null>(null)
  const [seenMatchResultKey, setSeenMatchResultKey] = useState<string | null>(
    null,
  )
  const [surrenderConfirmOpen, setSurrenderConfirmOpen] = useState(false)

  const challengeQuery = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const { data } = await api.get<Challenge>(`/challenges/${id}`)
      return data
    },
  })

  const challenge = challengeQuery.data
  const testCases = challenge?.cases ?? []
  const examples = challenge?.examples ?? []
  const constraints = challenge?.constraints ?? []
  const conditions = challenge?.conditions ?? []
  const code = codeByLanguage[selectedLanguage]
  const isPvpChallenge = challenge?.type === 'pvp'

  const matchQuery = useQuery({
    queryKey: ['match', matchId],
    enabled: isAuthenticated && !!matchId,
    refetchInterval: (query) =>
      query.state.data && (query.state.data as Match).status !== 'finished'
        ? 3000
        : false,
    queryFn: async () => {
      const { data } = await api.get<Match>(`/matches/${matchId}`)
      return data
    },
  })

  const publicMatchesQuery = useQuery({
    queryKey: ['public-matches', id],
    enabled: isAuthenticated && isPvpChallenge,
    refetchInterval: 3000,
    queryFn: async () => {
      const { data } = await api.get<Match[]>('/matches/public', {
        params: { challengeId: id },
      })
      return data
    },
  })

  const chatMessagesQuery = useQuery({
    queryKey: ['match-messages', matchId],
    enabled:
      isAuthenticated &&
      isPvpChallenge &&
      !!matchId &&
      activeSidebarTab === 'chat',
    refetchInterval: 3000,
    queryFn: async () => {
      const { data } = await api.get<MatchMessage[]>(
        `/matches/${matchId}/messages`,
      )
      return data
    },
  })

  const createMatchMutation = useMutation({
    mutationFn: async (visibility: 'private' | 'public') => {
      const { data } = await api.post<Match>('/matches/queue', {
        challengeId: id,
        visibility,
      })
      return data
    },
    onSuccess: (data) => {
      navigate({ to: '/challenge', search: { id, matchId: data.id } })
    },
  })

  const joinRandomMatchMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Match>('/matches/random', {
        challengeId: id,
      })
      return data
    },
    onSuccess: (data) => {
      navigate({ to: '/challenge', search: { id, matchId: data.id } })
    },
  })

  const joinMatchMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data } = await api.post<Match>(`/matches/${value}/join`)
      return data
    },
    onSuccess: (data) => {
      setJoinDialogOpen(false)
      setJoinMatchId('')
      navigate({ to: '/challenge', search: { id, matchId: data.id } })
    },
  })

  const surrenderMatchMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) {
        throw new Error('No active match selected.')
      }

      const { data } = await api.post<Match>(`/matches/${matchId}/surrender`)
      return data
    },
    onSuccess: () => {
      void matchQuery.refetch()
    },
  })

  const submitMatchMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) {
        throw new Error('No active match selected.')
      }

      const { data } = await api.post<Match>(`/matches/${matchId}/submit`, {
        language: selectedLanguage,
        sourceCode: code,
      })

      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['challenge-reviews', id],
      })
      void matchQuery.refetch()
    },
  })

  const submitSoloMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        id: string
        verdict:
          | 'accepted'
          | 'wrong_answer'
          | 'compilation_error'
          | 'runtime_error'
        passedCount: number
        totalCount: number
        results: TestResult[]
      }>('/submissions', {
        challengeId: id,
        language: selectedLanguage,
        sourceCode: code,
      })

      return data
    },
    onSuccess: async (data) => {
      setTestResults(data.results)
      await queryClient.invalidateQueries({
        queryKey: ['challenge-reviews', id],
      })
    },
  })

  const sendChatMessageMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) {
        throw new Error('No active match selected.')
      }

      const { data } = await api.post<MatchMessage>(
        `/matches/${matchId}/messages`,
        {
          content: chatDraft.trim(),
        },
      )

      return data
    },
    onSuccess: async () => {
      setChatDraft('')
      await chatMessagesQuery.refetch()
    },
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateEditorTheme = () => {
      const style = getComputedStyle(document.documentElement)

      const colors = {
        background: style.getPropertyValue('--background').trim(),
        foreground: style.getPropertyValue('--foreground').trim(),
        primary: style.getPropertyValue('--primary').trim(),
        accent: style.getPropertyValue('--accent').trim(),
        muted: style.getPropertyValue('--muted-foreground').trim(),
        rare: style.getPropertyValue('--rare').trim(),
        epic: style.getPropertyValue('--epic').trim(),
        destructive: style.getPropertyValue('--destructive').trim(),
      }

      loader.init().then((monaco) => {
        monaco.editor.defineTheme('lockin-theme', {
          base: theme === 'light' ? 'vs' : 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: colors.muted, fontStyle: 'italic' },
            { token: 'keyword', foreground: colors.rare },
            { token: 'number', foreground: colors.epic },
            { token: 'string', foreground: colors.destructive },
          ],
          colors: {
            'editor.background': colors.background,
            'editor.foreground': colors.foreground,
            'editorCursor.foreground': colors.foreground,
            'editor.lineHighlightBackground': colors.accent + '20',
            'editorLineNumber.foreground': colors.muted,
            'editor.selectionBackground': colors.primary + '33',
          },
        })

        monaco.editor.setTheme('lockin-theme')
      })
    }

    const rafId = requestAnimationFrame(() => {
      updateEditorTheme()
    })

    return () => cancelAnimationFrame(rafId)
  }, [theme])

  useEffect(() => {
    setActiveTestCase(0)
    setTestResults([])
    setSelectedLanguage('javascript')
    setCodeByLanguage(buildCodeByLanguage(challenge))
    setActiveSidebarTab('content')
    setChatDraft('')
    setSeenMatchResultKey(null)
  }, [challenge, id])

  const activeCase = useMemo(
    () => testCases[activeTestCase] ?? null,
    [activeTestCase, testCases],
  )
  const currentMatch = matchQuery.data
  const chatMessages = chatMessagesQuery.data ?? []
  const currentPlayerSubmission = currentMatch?.submissions.find(
    (submission) => submission.userId === user?.id,
  )
  const opponentSubmission = currentMatch?.submissions.find(
    (submission) => submission.userId !== user?.id,
  )
  const winningAcceptedSubmission = currentMatch?.winnerId
    ? currentMatch.submissions.find(
        (submission) =>
          submission.userId === currentMatch.winnerId &&
          submission.verdict === 'accepted',
      )
    : null
  const publicMatches = publicMatchesQuery.data ?? []
  const isCurrentUserWinner = currentMatch?.winner?.id === user?.id
  const isCurrentUserLoser =
    !!currentMatch?.winner?.id &&
    currentMatch.winner.id !== user?.id &&
    !!user?.id
  const isCancelledMatch =
    currentMatch?.status === 'finished' && !currentMatch.winnerId
  const endedByAcceptedSubmission = !!winningAcceptedSubmission
  const canSubmitToMatch =
    !!currentMatch && currentMatch.status === 'active' && !currentMatch.winnerId
  const canViewChallenge =
    !isPvpChallenge || (!!currentMatch && currentMatch.canViewChallenge)
  const canUseMatchChat =
    !!currentMatch &&
    !!currentMatch.playerTwoId &&
    currentMatch.status !== 'waiting' &&
    !!matchId
  const runTestsTooltip = !isAuthenticated
    ? 'Log in to run tests'
    : isPvpChallenge && !canViewChallenge
      ? 'The problem unlocks when both players join the match'
      : testCases.length === 0
        ? 'No test cases available'
        : isRunning
          ? 'Running tests'
          : 'Run the visible test cases'
  const submitTooltip = !isAuthenticated
    ? 'Log in to submit solutions'
    : isPvpChallenge && !canViewChallenge
      ? 'The problem unlocks when both players join the match'
      : isPvpChallenge && !matchId
        ? 'Create or join a 1v1 match first'
        : isPvpChallenge && currentMatch?.status === 'waiting'
          ? 'Waiting for a second player to join'
          : isPvpChallenge && currentMatch?.status === 'finished'
            ? 'This match has already finished'
            : submitMatchMutation.isPending
              ? 'Submitting to the match'
              : submitSoloMutation.isPending
                ? 'Submitting your solution'
                : testCases.length === 0
                  ? 'No test cases available'
                  : 'Submit your solution'

  useEffect(() => {
    if (!currentMatch || currentMatch.status !== 'finished') {
      return
    }

    const resultKey = `${currentMatch.id}:${currentMatch.endedAt ?? currentMatch.updatedAt}`

    if (seenMatchResultKey === resultKey) {
      return
    }

    if (isCancelledMatch) {
      setMatchResultDialog({
        title: 'Match Cancelled',
        description: currentMatch.playerTwoId
          ? 'The duel ended before anyone won. Create a new match to play again.'
          : 'You closed the match before an opponent joined.',
      })
      setSeenMatchResultKey(resultKey)
      return
    }

    if (isCurrentUserWinner) {
      setMatchResultDialog({
        title: 'You Won',
        description: endedByAcceptedSubmission
          ? 'Your accepted submission finished first and won the match.'
          : 'Your opponent surrendered, so you win by forfeit.',
      })
      setSeenMatchResultKey(resultKey)
      return
    }

    if (isCurrentUserLoser) {
      setMatchResultDialog({
        title: 'You Lost',
        description: endedByAcceptedSubmission
          ? `${currentMatch.winner?.username ?? 'Your opponent'} submitted the first accepted solution.`
          : 'You surrendered the match, so your opponent wins by forfeit.',
        variant: 'destructive',
      })
      setSeenMatchResultKey(resultKey)
    }
  }, [
    currentMatch,
    endedByAcceptedSubmission,
    isCancelledMatch,
    isCurrentUserLoser,
    isCurrentUserWinner,
    seenMatchResultKey,
  ])

  const handleRunTests = async () => {
    if (!isAuthenticated || !challenge || !canViewChallenge) return

    setIsRunning(true)

    try {
      const { data } = await api.post<{
        language: EditorLanguage
        results: TestResult[]
      }>('/code/run', {
        challengeId: challenge.id,
        language: selectedLanguage,
        sourceCode: code,
      })

      setTestResults(data.results)
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : (err.response?.data?.message ?? 'Failed to run tests.')
        : err instanceof Error
          ? err.message
          : 'Failed to run tests.'
      setMessageDialog({
        title: 'Execution Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) return

    if (isPvpChallenge) {
      if (!canViewChallenge) {
        setMessageDialog({
          title: 'Problem Locked',
          description: 'The problem unlocks when both players join the match.',
        })
        return
      }

      if (!matchId) {
        setMessageDialog({
          title: 'Match Required',
          description: 'Create or join a 1v1 match first.',
        })
        return
      }

      if (!canSubmitToMatch) {
        setMessageDialog({
          title: 'Match Not Ready',
          description: 'This 1v1 match is not ready for submissions.',
        })
        return
      }

      try {
        await submitMatchMutation.mutateAsync()
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? Array.isArray(err.response?.data?.message)
            ? err.response.data.message.join(', ')
            : (err.response?.data?.message ?? 'Failed to submit to the match.')
          : err instanceof Error
            ? err.message
            : 'Failed to submit to the match.'
        setMessageDialog({
          title: 'Match Submission Error',
          description: message,
          variant: 'destructive',
        })
      }

      return
    }

    try {
      const submission = await submitSoloMutation.mutateAsync()
      const verdictLabel = submission.verdict.replaceAll('_', ' ').toUpperCase()
      setMessageDialog({
        title: `Submission ${verdictLabel}`,
        description: `${submission.passedCount}/${submission.totalCount} test cases passed.`,
      })
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : (err.response?.data?.message ?? 'Failed to submit this solution.')
        : err instanceof Error
          ? err.message
          : 'Failed to submit this solution.'
      setMessageDialog({
        title: 'Submission Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleCopyMatchId = async () => {
    if (!matchId) {
      return
    }

    try {
      await navigator.clipboard.writeText(matchId)
      setMessageDialog({
        title: 'Match ID Copied',
        description: 'The current match ID is ready to share.',
      })
    } catch {
      setMessageDialog({
        title: 'Copy Failed',
        description: 'Could not copy the match ID.',
        variant: 'destructive',
      })
    }
  }

  const handleSendChatMessage = async () => {
    if (!canUseMatchChat || !chatDraft.trim()) {
      return
    }

    try {
      await sendChatMessageMutation.mutateAsync()
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : (err.response?.data?.message ?? 'Failed to send this message.')
        : err instanceof Error
          ? err.message
          : 'Failed to send this message.'
      setMessageDialog({
        title: 'Chat Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    const isTextEntryTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false

      return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isDialogOpen =
        joinDialogOpen ||
        shortcutsOpen ||
        surrenderConfirmOpen ||
        !!messageDialog
      const isShortcutHelp =
        event.key === 'F1' ||
        (!event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          event.key === '?' &&
          !isTextEntryTarget(event.target))
      const isNonTypingShortcut = !isTextEntryTarget(event.target)
      const isRunShortcut =
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key === 'Enter'
      const isSubmitShortcut =
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        event.key === 'Enter'
      const isBackShortcut =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'b' &&
        isNonTypingShortcut
      const isLanguageShortcut =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'l' &&
        isNonTypingShortcut
      const isPreviousCaseShortcut =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key === ',' &&
        isNonTypingShortcut
      const isNextCaseShortcut =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key === '.' &&
        isNonTypingShortcut
      const isCopyMatchShortcut =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'm' &&
        isNonTypingShortcut

      if (isShortcutHelp) {
        event.preventDefault()
        setShortcutsOpen(true)
        return
      }

      if (isDialogOpen) {
        return
      }

      if (isBackShortcut) {
        event.preventDefault()
        navigate({ to: '/challenges' })
        return
      }

      if (isLanguageShortcut) {
        event.preventDefault()
        document.getElementById('challenge-editor-language')?.focus()
        return
      }

      if (isPreviousCaseShortcut && testCases.length > 0) {
        event.preventDefault()
        setActiveTestCase((current) =>
          current === 0 ? testCases.length - 1 : current - 1,
        )
        return
      }

      if (isNextCaseShortcut && testCases.length > 0) {
        event.preventDefault()
        setActiveTestCase((current) =>
          current === testCases.length - 1 ? 0 : current + 1,
        )
        return
      }

      if (isCopyMatchShortcut && matchId) {
        event.preventDefault()
        void handleCopyMatchId()
        return
      }

      if (isRunShortcut) {
        event.preventDefault()
        void handleRunTests()
        return
      }

      if (isSubmitShortcut) {
        event.preventDefault()
        void handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    joinDialogOpen,
    shortcutsOpen,
    surrenderConfirmOpen,
    messageDialog,
    isAuthenticated,
    canViewChallenge,
    isPvpChallenge,
    matchId,
    selectedLanguage,
    code,
    navigate,
    currentMatch,
    testCases.length,
  ])

  if (challengeQuery.isLoading) {
    return (
      <div className="mt-16 flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading challenge...
      </div>
    )
  }

  if (challengeQuery.isError || !challenge) {
    return (
      <div className="mt-16 mx-auto max-w-3xl p-6">
        <Alert variant="destructive" className="rounded-none">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Challenge unavailable</AlertTitle>
          <AlertDescription>
            Unable to load this challenge from the backend.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  return (
    <div className="mt-16 flex min-h-screen flex-col bg-background text-muted-foreground">
      <nav className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary-foreground rounded-none"
                onClick={() => navigate({ to: '/challenges' })}
                aria-label="Back to challenges"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to challenges</TooltipContent>
          </Tooltip>
          <div className="flex min-w-0 items-center gap-2">
            <Terminal className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-foreground text-sm tracking-wider uppercase">
              {challenge.title}
            </span>
            <Badge className="rounded-none h-5 shrink-0 border-primary bg-primary/10 text-[10px] text-primary uppercase">
              {formatDifficulty(challenge.difficulty)}
            </Badge>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-4 sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            className='rounded-none'
            size="sm"
            onClick={() => setShortcutsOpen(true)}
          >
            Shortcuts
          </Button>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="h-2 w-2 rounded-none bg-primary animate-pulse" />
            Environment Ready
          </div>
        </div>
      </nav>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="w-full border-b border-foreground/5 bg-background lg:w-104 lg:border-r lg:border-b-0">
          <div className="w-full border-b border-border">
            <Button
              className="rounded-none border-r border-border font-semibold"
              variant={activeSidebarTab === 'content' ? 'default' : 'secondary'}
              onClick={() => setActiveSidebarTab('content')}
            >
              Content
            </Button>
            <Button
              variant={activeSidebarTab === 'reviews' ? 'default' : 'secondary'}
              className="rounded-none border-r border-border font-semibold"
              onClick={() => setActiveSidebarTab('reviews')}
            >
              Reviews
            </Button>
            {isPvpChallenge ? (
              <Button
                variant={activeSidebarTab === 'chat' ? 'default' : 'secondary'}
                className="rounded-none border-r border-border font-semibold"
                onClick={() => setActiveSidebarTab('chat')}
              >
                Chat
              </Button>
            ) : null}
          </div>
          <div className="space-y-8 overflow-y-auto p-4 sm:p-6 lg:max-h-[calc(100vh-7rem)]">
            {activeSidebarTab === 'content' ? (
              <>
                {isPvpChallenge ? (
                  <div className="rounded-none border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                          1v1 Match
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Queue a duel or join an existing match by ID.
                        </p>
                      </div>
                      <Badge className="rounded-none bg-primary/10 text-primary uppercase">
                        {currentMatch?.status ?? 'lobby'}
                      </Badge>
                    </div>

                    {matchId ? (
                      <div className="space-y-3 rounded-none border border-border/60 bg-background/60 p-3">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Match ID
                          </p>
                          <code className="block break-all text-xs text-foreground">
                            {matchId}
                          </code>
                        </div>

                        {matchQuery.isError ? (
                          <Alert variant="destructive" className="rounded-none">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Match unavailable</AlertTitle>
                            <AlertDescription>
                              {axios.isAxiosError(matchQuery.error)
                                ? (matchQuery.error.response?.data?.message ??
                                  'Unable to load this match.')
                                : 'Unable to load this match.'}
                            </AlertDescription>
                          </Alert>
                        ) : currentMatch ? (
                          <div className="space-y-3 text-xs text-foreground">
                            <p>
                              Visibility:{' '}
                              <span className="font-bold uppercase">
                                {currentMatch.visibility}
                              </span>
                            </p>
                            {currentMatch.status === 'waiting' ? (
                              <Alert className='rounded-none'>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Waiting For Opponent</AlertTitle>
                                <AlertDescription>
                                  Share the match ID with another player. The
                                  duel starts as soon as they join.
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {currentMatch.status === 'active' &&
                            !currentMatch.winner ? (
                              <Alert className='rounded-none'>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Match In Progress</AlertTitle>
                                <AlertDescription>
                                  First accepted submission wins this duel.
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {isCurrentUserWinner ? (
                              <Alert className='rounded-none'>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>You Won</AlertTitle>
                                <AlertDescription>
                                  {endedByAcceptedSubmission
                                    ? 'Your submission finished first and won the 1v1 match.'
                                    : 'Your opponent surrendered, so you win by forfeit.'}
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {isCurrentUserLoser ? (
                              <Alert variant="destructive" className='rounded-none'>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>You Lost</AlertTitle>
                                <AlertDescription>
                                  {endedByAcceptedSubmission
                                    ? `${currentMatch.winner?.username ?? 'Your opponent'} submitted the first accepted solution.`
                                    : 'You surrendered the match, so your opponent wins by forfeit.'}
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {isCancelledMatch ? (
                              <Alert className="rounded-none">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Match Cancelled</AlertTitle>
                                <AlertDescription>
                                  This duel ended before anyone won. You can
                                  leave this view and create a new match.
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            <p>
                              Player One:{' '}
                              <span className="font-bold">
                                {currentMatch.playerOne?.id === user?.id
                                  ? 'You'
                                  : (currentMatch.playerOne?.username ??
                                    currentMatch.playerOneId)}
                              </span>
                            </p>
                            <p>
                              Player Two:{' '}
                              <span className="font-bold">
                                {currentMatch.playerTwo
                                  ? currentMatch.playerTwo.id === user?.id
                                    ? 'You'
                                    : currentMatch.playerTwo.username
                                  : 'Waiting for opponent'}
                              </span>
                            </p>
                            <p>
                              Your latest verdict:{' '}
                              <span className="font-bold uppercase">
                                {currentPlayerSubmission?.verdict ?? 'none'}
                              </span>
                            </p>
                            <p>
                              Opponent latest verdict:{' '}
                              <span className="font-bold uppercase">
                                {opponentSubmission?.verdict ?? 'none'}
                              </span>
                            </p>
                            {currentMatch.winnerId ? (
                              <p className="text-primary">
                                Winner:{' '}
                                <span className="font-bold">
                                  {currentMatch.winner?.id === user?.id
                                    ? 'You'
                                    : (currentMatch.winner?.username ??
                                      currentMatch.winnerId)}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Loading match state...
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleCopyMatchId()}
                            className='rounded-none'
                          >
                            Copy match ID
                          </Button>
                          <Button
                            type="button"
                            className='rounded-none'
                            variant="destructive"
                            size="sm"
                            onClick={() => setSurrenderConfirmOpen(true)}
                            disabled={
                              !currentMatch ||
                              currentMatch.status === 'finished' ||
                              surrenderMatchMutation.isPending
                            }
                          >
                            {surrenderMatchMutation.isPending
                              ? 'Surrendering...'
                              : 'Surrender Match'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className='rounded-none'
                            size="sm"
                            onClick={() =>
                              navigate({ to: '/challenge', search: { id } })
                            }
                          >
                            Leave match view
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            className='rounded-none'
                            onClick={() =>
                              createMatchMutation.mutate('private')
                            }
                            disabled={
                              !isAuthenticated || createMatchMutation.isPending
                            }
                          >
                            {createMatchMutation.isPending
                              ? 'Creating...'
                              : 'Create Private Match'}
                          </Button>
                          <Button
                            type="button"
                            className='rounded-none'
                            variant="outline"
                            onClick={() => createMatchMutation.mutate('public')}
                            disabled={
                              !isAuthenticated || createMatchMutation.isPending
                            }
                          >
                            {createMatchMutation.isPending
                              ? 'Creating...'
                              : 'Create Public Match'}
                          </Button>
                          <Button
                            type="button"
                            className='rounded-none'
                            variant="outline"
                            onClick={() => setJoinDialogOpen(true)}
                            disabled={
                              !isAuthenticated || joinMatchMutation.isPending
                            }
                          >
                            Join by ID
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className='rounded-none'
                            onClick={() => joinRandomMatchMutation.mutate()}
                            disabled={
                              !isAuthenticated ||
                              joinRandomMatchMutation.isPending ||
                              publicMatches.length === 0
                            }
                          >
                            {joinRandomMatchMutation.isPending
                              ? 'Joining...'
                              : 'Join Random Public Match'}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Swords className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                              Public Waiting Matches
                            </p>
                          </div>
                          {publicMatchesQuery.isLoading ? (
                            <p className="text-xs text-muted-foreground">
                              Loading public duels...
                            </p>
                          ) : publicMatches.length > 0 ? (
                            <div className="space-y-2">
                              {publicMatches.map((match) => (
                                <div
                                  key={match.id}
                                  className="flex flex-col gap-2 rounded-none border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="space-y-1">
                                    <p className="text-xs text-foreground">
                                      Host:{' '}
                                      <span className="font-bold">
                                        {match.playerOne?.username ??
                                          match.playerOneId}
                                      </span>
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                      Match ID: {match.id}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    className='rounded-none'
                                    size="sm"
                                    onClick={() =>
                                      joinMatchMutation.mutate(match.id)
                                    }
                                    disabled={joinMatchMutation.isPending}
                                  >
                                    Join
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No public waiting matches yet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
                    Mission Briefing
                  </h3>
                  <h1 className="text-2xl text-foreground uppercase tracking-tight sm:text-3xl">
                    {challenge.title}
                  </h1>
                </div>

                <div className="space-y-4 text-sm leading-relaxed text-foreground">
                  {canViewChallenge ? (
                    challenge.content
                      .split('\n')
                      .filter(Boolean)
                      .map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                  ) : (
                    <p className="text-muted-foreground">
                      The challenge briefing is hidden until both players join
                      the match.
                    </p>
                  )}
                </div>

                <div className="space-y-6">
                  {canViewChallenge ? (
                    <>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                        <Code2 className="w-4 h-4" /> Examples
                      </div>

                      {examples.length > 0 ? (
                        examples.map((example, index) => (
                          <div
                            key={`${example}-${index}`}
                            className="rounded-none border border-foreground/5 bg-foreground/1 p-4 space-y-2 font-mono text-[13px]"
                          >
                            <div className="text-foreground">
                              Example {index + 1}:
                            </div>
                            <div className="text-muted-foreground whitespace-pre-wrap">
                              {example}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No examples provided.
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert className="rounded-none">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Problem Locked</AlertTitle>
                      <AlertDescription>
                        The full challenge statement, examples, and editor
                        unlock once both players are in the match.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="rounded-none border border-foreground/5 bg-foreground/2 p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rarity-legendary">
                      <AlertCircle className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">
                        Constraints
                      </h4>
                    </div>
                    {canViewChallenge ? (
                      <ul className="space-y-2 font-mono text-[12px] text-foreground">
                        {constraints.length > 0 ? (
                          constraints.map((constraint, index) => (
                            <li key={`${constraint}-${index}`}>{constraint}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">
                            No constraints provided.
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Constraints are hidden until the duel begins.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-none border border-foreground/5 bg-foreground/2 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-widest">
                      Victory Conditions
                    </h4>
                  </div>
                  {canViewChallenge ? (
                    <ul className="space-y-3">
                      {conditions.length > 0 ? (
                        conditions.map((condition, index) => (
                          <li
                            key={`${condition}-${index}`}
                            className="flex items-start gap-3 text-xs text-foreground"
                          >
                            <div className="w-1 h-1 rounded-none bg-foreground mt-1.5" />
                            {condition}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-muted-foreground">
                          No specific victory conditions provided.
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Victory conditions are hidden until the duel begins.
                    </p>
                  )}
                </div>
              </>
            ) : null}

            {activeSidebarTab === 'reviews' ? (
              <ChallengeReviewsPanel challengeId={id} />
            ) : null}

            {activeSidebarTab === 'chat' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Match Chat
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Talk with the other competitor in this 1v1 match.
                  </p>
                </div>

                {!matchId ? (
                  <Alert className="rounded-none">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Match Selected</AlertTitle>
                    <AlertDescription>
                      Create or join a 1v1 match first to unlock chat.
                    </AlertDescription>
                  </Alert>
                ) : !canUseMatchChat ? (
                  <Alert className="rounded-none">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Chat Locked</AlertTitle>
                    <AlertDescription>
                      Chat unlocks when both players are in the match.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="max-h-80 space-y-3 overflow-y-auto rounded-none  bg-background/60 ">
                      {chatMessagesQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">
                          Loading messages...
                        </p>
                      ) : chatMessages.length > 0 ? (
                        chatMessages.map((message) => {
                          const isCurrentUserMessage =
                            message.userId === user?.id

                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isCurrentUserMessage
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-none border p-3 ${
                                  isCurrentUserMessage
                                    ? 'border-primary/30 bg-primary/10 text-foreground'
                                    : 'border-border bg-background text-foreground'
                                }`}
                              >
                                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                                  <span>
                                    {isCurrentUserMessage
                                      ? 'You'
                                      : (message.username ?? 'Opponent')}
                                  </span>
                                  <span>
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No messages yet. Say something.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <textarea
                        value={chatDraft}
                        onChange={(event) => setChatDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Enter' &&
                            !event.shiftKey &&
                            !sendChatMessageMutation.isPending
                          ) {
                            event.preventDefault()
                            void handleSendChatMessage()
                          }
                        }}
                        className="min-h-28 rounded-none border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        placeholder="Send a message to your opponent..."
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          className="rounded-none"
                          onClick={() => void handleSendChatMessage()}
                          disabled={
                            !chatDraft.trim() ||
                            sendChatMessageMutation.isPending
                          }
                        >
                          {sendChatMessageMutation.isPending
                            ? 'Sending...'
                            : 'Send message'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {activeSidebarTab === 'content' ? (
            <div className="border-t border-foreground/5 p-4 sm:p-6">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Acceptance Rate
                </span>
                <span className="text-[10px] font-mono text-primary">
                  {Number(challenge.acceptanceRate).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Number(challenge.acceptanceRate)}
                className="h-1 bg-primary-foreground"
              />
            </div>
          ) : null}
        </aside>

        <main className="relative flex flex-1 flex-col bg-background">
          <div className="flex min-h-0 flex-col font-mono text-sm leading-6 lg:flex-1">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <Label
                  htmlFor="challenge-editor-language"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Editor Language
                </Label>
                <p className="text-xs text-muted-foreground">
                  Syntax highlighting and starter templates switch with the
                  selected language.
                </p>
              </div>
              <Select
                value={selectedLanguage}
                onValueChange={(value) =>
                  setSelectedLanguage(value as EditorLanguage)
                }
              >
                <SelectTrigger
                  id="challenge-editor-language"
                  className="w-full sm:w-44"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canViewChallenge ? (
              <div className="min-h-88 flex-1 lg:min-h-0">
                <Editor
                  key={`${id}-${selectedLanguage}`}
                  path={getEditorPath(id, selectedLanguage)}
                  language={selectedLanguage}
                  options={{
                    minimap: { enabled: true },
                    padding: { top: 24 },
                    readOnly: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                  value={code}
                  onChange={(value) =>
                    setCodeByLanguage((current) => ({
                      ...current,
                      [selectedLanguage]: value || '',
                    }))
                  }
                  theme="lockin-theme"
                  loading={
                    <div className="h-full w-full bg-background animate-pulse" />
                  }
                />
              </div>
            ) : (
              <div className="flex min-h-88 items-center justify-center border-t border-border bg-background p-6 text-center">
                <div className="max-w-md space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                    Editor Locked
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The code editor unlocks as soon as a second player joins
                    this 1v1 match.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-col border-t border-border bg-background lg:flex-1">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3">
              <span className="mr-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Test Runner
              </span>
              {testCases.map((_, index) => (
                <Button
                  key={index}
                  onClick={() => setActiveTestCase(index)}
                  variant={activeTestCase === index ? 'default' : 'secondary'}
                  className="h-9 rounded-none font-bold"
                >
                  CASE_{index + 1}
                </Button>
              ))}
              <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={handleRunTests}
                        aria-keyshortcuts="Control+Shift+Enter Meta+Shift+Enter"
                        disabled={
                          isRunning ||
                          !isAuthenticated ||
                          testCases.length === 0 ||
                          !canViewChallenge
                        }
                        className="h-10 w-full rounded-none border-foreground/10 bg-transparent text-xs font-bold gap-2 hover:bg-primary-foreground sm:w-auto"
                      >
                        <Play
                          className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`}
                        />
                        {isRunning ? 'EXECUTING...' : 'RUN TESTS'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>{runTestsTooltip}</p>
                      <p>`Ctrl/Cmd+Shift+Enter` runs tests</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="w-full sm:w-auto">
                      <Button
                        disabled={
                          !isAuthenticated ||
                          testCases.length === 0 ||
                          !canViewChallenge ||
                          submitMatchMutation.isPending ||
                          submitSoloMutation.isPending
                        }
                        onClick={handleSubmit}
                        aria-keyshortcuts="Control+Enter Meta+Enter"
                        className="h-10 w-full rounded-none bg-primary px-8 text-xs font-bold gap-2 text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] disabled:opacity-50 sm:w-auto"
                      >
                        <Send className="w-3 h-3" />{' '}
                        {submitMatchMutation.isPending ||
                        submitSoloMutation.isPending
                          ? 'SUBMITTING...'
                          : 'SUBMIT'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>{submitTooltip}</p>
                      <p>`Ctrl/Cmd+Enter` submits</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="border-b border-border p-4">
                <Alert variant="destructive" className="rounded-none">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Required</AlertTitle>
                  <AlertDescription>
                    Guests can view the challenge, but running tests and
                    submitting code require a signed-in account.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto p-4 font-mono sm:p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Input Parameters
                    </span>
                    <div className="h-px w-4 bg-border" />
                  </div>

                  {canViewChallenge && activeCase ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {activeCase.inputs.map((input, index) => (
                        <div
                          key={`${input.type}-${index}`}
                          className="bg-muted/30 p-3 rounded border border-border/50"
                        >
                          <div className="text-[9px] text-primary mb-1 uppercase tracking-tighter">
                            {input.type}
                          </div>
                          <div className="text-sm text-foreground wrap-break-word">
                            {input.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : canViewChallenge ? (
                    <div className="text-sm text-muted-foreground">
                      No test cases available for this challenge.
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Test inputs unlock when both players join the duel.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Execution Output
                    </span>
                    <div className="h-px w-4 bg-border" />
                  </div>

                  {testResults[activeTestCase] ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase">
                            Actual
                          </span>
                          <div
                            className={`p-3 rounded border font-bold ${
                              testResults[activeTestCase].passed
                                ? 'bg-green-500/5 border-green-500/20 text-green-500'
                                : 'bg-destructive/5 border-destructive/20 text-destructive'
                            }`}
                          >
                            {testResults[activeTestCase].actual}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase">
                            Expected
                          </span>
                          <div className="bg-muted/30 p-3 rounded border border-border text-foreground">
                            {testResults[activeTestCase].expected}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3 h-3" /> Runtime:{' '}
                          {testResults[activeTestCase].runtime}ms
                        </span>
                        {testResults[activeTestCase].memoryKb != null ? (
                          <span>
                            Memory: {testResults[activeTestCase].memoryKb} KB
                          </span>
                        ) : null}
                        <span
                          className={
                            testResults[activeTestCase].passed
                              ? 'text-green-500'
                              : 'text-destructive'
                          }
                        >
                          {testResults[activeTestCase].passed
                            ? 'STATUS: SUCCESS'
                            : 'STATUS: FAILURE'}
                        </span>
                      </div>
                    </div>
                  ) : canViewChallenge ? (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border rounded-none bg-muted/5">
                      <div className="p-3 rounded-none bg-muted/20 mb-2">
                        <Play className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest animate-pulse">
                        Waiting for compilation...
                      </p>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center rounded-none border border-dashed border-border bg-muted/5">
                      <div className="p-3 rounded-none bg-muted/20 mb-2">
                        <AlertCircle className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                        Execution panel locked until match start
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden border-t border-foreground/5 bg-background px-6 py-4 md:flex md:items-center md:justify-between">
            <div className="flex items-center gap-4 rounded-none border border-foreground/10 bg-primary-foreground p-2 pr-6">
              <div className="w-10 h-10 rounded bg-linear-to-br from-primary to-blue-600 p-px">
                <div className="w-full h-full bg-background rounded flex items-center justify-center overflow-hidden">
                  <img
                    src="/cat.jpg"
                    alt="Pet"
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
              </div>
              <div>
                <h5 className="text-[10px] font-bold text-foreground leading-none">
                  NEON DRAGON
                </h5>
                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">
                  Buff Active: +15% XP
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join 1v1 Match</DialogTitle>
            <DialogDescription>
              Paste a match ID for this challenge to join the duel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="join-match-id">Match ID</Label>
            <Input
              id="join-match-id"
              value={joinMatchId}
              onChange={(event) => setJoinMatchId(event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          {joinMatchMutation.isError ? (
            <Alert variant="destructive" className="rounded-none">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Join failed</AlertTitle>
              <AlertDescription>
                {axios.isAxiosError(joinMatchMutation.error)
                  ? (joinMatchMutation.error.response?.data?.message ??
                    'Unable to join this match.')
                  : 'Unable to join this match.'}
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setJoinDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => joinMatchMutation.mutate(joinMatchId.trim())}
              disabled={!joinMatchId.trim() || joinMatchMutation.isPending}
            >
              {joinMatchMutation.isPending ? 'Joining...' : 'Join match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        description="The challenge page can be used without a mouse."
        items={[
          {
            action: 'Submit current solution',
            shortcuts: ['Ctrl+Enter', 'Cmd+Enter'],
          },
          {
            action: 'Run visible test cases',
            shortcuts: ['Ctrl+Shift+Enter', 'Cmd+Shift+Enter'],
          },
          {
            action: 'Open shortcuts help',
            shortcuts: ['?', 'F1'],
          },
          {
            action: 'Go back to challenge list',
            shortcuts: ['Alt+B'],
          },
          {
            action: 'Focus language selector',
            shortcuts: ['Alt+L'],
          },
          {
            action: 'Previous or next test case',
            shortcuts: ['Alt+,', 'Alt+.'],
          },
          {
            action: 'Copy current match ID',
            shortcuts: ['Alt+M'],
          },
        ]}
        footerNote="Use Tab and Shift+Tab to move between the editor toolbar, match controls, dialogs, and test results."
      />
      <MessageDialog
        message={messageDialog}
        onOpenChange={(open) => {
          if (!open) {
            setMessageDialog(null)
          }
        }}
      />
      <MessageDialog
        message={matchResultDialog}
        onOpenChange={(open) => {
          if (!open) {
            setMatchResultDialog(null)
          }
        }}
      />
      <ConfirmDialog
        open={surrenderConfirmOpen}
        onOpenChange={setSurrenderConfirmOpen}
        title="Surrender Match"
        description="This will end the duel immediately. If your opponent already joined, they win."
        confirmLabel="Surrender Match"
        confirmVariant="destructive"
        isPending={surrenderMatchMutation.isPending}
        onConfirm={async () => {
          if (!currentMatch || currentMatch.status === 'finished') {
            setSurrenderConfirmOpen(false)
            return
          }

          try {
            await surrenderMatchMutation.mutateAsync()
            setSurrenderConfirmOpen(false)
          } catch (err) {
            const message = axios.isAxiosError(err)
              ? Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join(', ')
                : (err.response?.data?.message ??
                  'Unable to surrender this match.')
              : err instanceof Error
                ? err.message
                : 'Unable to surrender this match.'

            setSurrenderConfirmOpen(false)
            setMessageDialog({
              title: 'Match Surrender Error',
              description: message,
              variant: 'destructive',
            })
          }
        }}
      />
    </div>
  )
}

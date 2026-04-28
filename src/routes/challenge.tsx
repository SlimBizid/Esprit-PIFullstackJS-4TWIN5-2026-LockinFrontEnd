import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
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
import {
  api,
  useIsAuthenticated,
  useUser,
  useUserStore,
} from '@/stores/userStore'
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
import { ThatsNotMyCoderChallenge } from '@/components/thats-not-my-coder-challenge'
import { Input } from '@/components/ui/input'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import type { Challenge } from '@/models/challenge'
import type { EditorLanguage } from '@/models/editor-language'
import type {
  ImposterLobbySummary,
  ImposterMatch,
} from '@/models/imposter-match'
import type { Match, MatchMessage } from '@/models/match'
import type { TestResult } from '@/models/test-result'
import { LANGUAGE_FILE_EXTENSIONS } from '@/models/language-file-extensions'
import { LANGUAGE_LABELS } from '@/models/lagnuage-labels'

const challengeSearchSchema = z.object({
  id: z.coerce.number().int().positive(),
  matchId: z.string().uuid().optional(),
  imposterMatchId: z.string().uuid().optional(),
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

function buildInitialQuizAnswers(challenge?: Challenge) {
  return Object.fromEntries(
    (challenge?.quizQuestions ?? []).map((question) => [question.id, []]),
  ) as Record<string, string[]>
}

function getCaseInputValue(
  testCase: Challenge['cases'][number] | null | undefined,
  type: string,
) {
  if (!testCase) return ''

  const match = testCase.inputs.find((input) => input.type === type)
  return match?.value ?? ''
}

const DEFAULT_CSS_BATTLE_VIEWPORT = { width: 400, height: 300 }
const DEFAULT_CSS_BATTLE_BACKGROUND = '#ffffff'
const CSS_BATTLE_GRID = { columns: 40, rows: 30 }

function buildCssBattleDocument(html: string, css: string, background: string) {
  return `<!doctype html>
<html>
  <head>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: ${background}; }
      ${css}
    </style>
  </head>
  <body>${html}</body>
</html>`
}

function buildCssBattleStarterMarkup(html: string, css: string) {
  const trimmedCss = css.trim()
  const trimmedHtml = html.trim()

  if (!trimmedCss) {
    return trimmedHtml
  }

  return `<style>${trimmedCss}</style>\n${trimmedHtml}`
}

function parseCssColor(value: string) {
  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (!match) return { r: 0, g: 0, b: 0, a: 1 }

  const [r, g, b, a] = match[1]
    .split(',')
    .map((part) => part.trim())
    .map((part, index) => (index === 3 ? Number(part) : Number(part)))

  return {
    r: Number.isFinite(r) ? r : 0,
    g: Number.isFinite(g) ? g : 0,
    b: Number.isFinite(b) ? b : 0,
    a: Number.isFinite(a) ? a : 1,
  }
}

function parseCssBattleColors(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return [] as string[]
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => String(entry ?? '').trim())
        .filter((entry) => entry.length > 0)
    }
  } catch {
    // Fallback parsing below.
  }

  return trimmed
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function resolvePointColor(doc: Document, x: number, y: number) {
  const element = doc.elementFromPoint(x, y)
  let current = element as HTMLElement | null

  while (current) {
    const color = getComputedStyle(current).backgroundColor
    const parsed = parseCssColor(color)
    if (parsed.a > 0) {
      return parsed
    }
    current = current.parentElement
  }

  const bodyColor = getComputedStyle(doc.body).backgroundColor
  return parseCssColor(bodyColor)
}

async function renderCssBattleFrame(
  markup: string,
  width: number,
  height: number,
) {
  const frame = document.createElement('iframe')
  frame.style.position = 'absolute'
  frame.style.left = '-10000px'
  frame.style.top = '0'
  frame.style.width = `${width}px`
  frame.style.height = `${height}px`
  frame.setAttribute('sandbox', 'allow-same-origin')
  frame.srcdoc = markup
  document.body.appendChild(frame)

  await new Promise<void>((resolve) => {
    frame.addEventListener('load', () => resolve(), { once: true })
  })

  await new Promise((resolve) => requestAnimationFrame(resolve))
  await new Promise((resolve) => requestAnimationFrame(resolve))

  return frame
}

async function sampleFrameColors(
  frame: HTMLIFrameElement,
  width: number,
  height: number,
) {
  const doc = frame.contentDocument

  if (!doc) {
    return []
  }

  const colors: Array<{ r: number; g: number; b: number }> = []
  const stepX = width / CSS_BATTLE_GRID.columns
  const stepY = height / CSS_BATTLE_GRID.rows

  for (let row = 0; row < CSS_BATTLE_GRID.rows; row += 1) {
    for (let col = 0; col < CSS_BATTLE_GRID.columns; col += 1) {
      const x = Math.min(width - 1, Math.floor((col + 0.5) * stepX))
      const y = Math.min(height - 1, Math.floor((row + 0.5) * stepY))
      const { r, g, b } = resolvePointColor(doc, x, y)
      colors.push({ r, g, b })
    }
  }

  return colors
}

async function scoreCssBattleMarkup(
  targetMarkup: string,
  submissionMarkup: string,
  width: number,
  height: number,
) {
  const [targetFrame, submissionFrame] = await Promise.all([
    renderCssBattleFrame(targetMarkup, width, height),
    renderCssBattleFrame(submissionMarkup, width, height),
  ])

  try {
    const [targetColors, submissionColors] = await Promise.all([
      sampleFrameColors(targetFrame, width, height),
      sampleFrameColors(submissionFrame, width, height),
    ])

    if (targetColors.length === 0 || submissionColors.length === 0) {
      return 0
    }

    const maxDistance = Math.sqrt(255 * 255 * 3)
    const totalDistance = targetColors.reduce((sum, color, index) => {
      const sample = submissionColors[index]
      if (!sample) return sum
      const dr = color.r - sample.r
      const dg = color.g - sample.g
      const db = color.b - sample.b
      return sum + Math.sqrt(dr * dr + dg * dg + db * db)
    }, 0)

    const avgDistance = totalDistance / targetColors.length
    const similarity = Math.max(0, 1 - avgDistance / maxDistance)
    return Math.round(similarity * 10000) / 100
  } finally {
    targetFrame.remove()
    submissionFrame.remove()
  }
}

async function buildCssBattleResults(
  cases: Challenge['cases'],
  sourceCode: string,
) {
  const results: TestResult[] = []

  for (const testCase of cases) {
    const targetHtml = getCaseInputValue(testCase, 'targetHtml')
    const targetCss = getCaseInputValue(testCase, 'targetCss')
    const background =
      getCaseInputValue(testCase, 'background') || DEFAULT_CSS_BATTLE_BACKGROUND
    const width = Number(getCaseInputValue(testCase, 'viewportWidth'))
    const height = Number(getCaseInputValue(testCase, 'viewportHeight'))
    const viewportWidth = Number.isFinite(width)
      ? width
      : DEFAULT_CSS_BATTLE_VIEWPORT.width
    const viewportHeight = Number.isFinite(height)
      ? height
      : DEFAULT_CSS_BATTLE_VIEWPORT.height
    const threshold = Number(testCase.expectedOutput)
    const requiredScore = Number.isFinite(threshold) ? threshold : 100

    if (!targetHtml.trim() || !targetCss.trim()) {
      results.push({
        passed: false,
        actual: '0.00%',
        expected: `${requiredScore.toFixed(2)}%`,
        runtime: '0',
        memoryKb: null,
        status: 'Missing target HTML/CSS.',
      })
      continue
    }

    const targetMarkup = buildCssBattleDocument(
      targetHtml,
      targetCss,
      background,
    )
    const submissionMarkup = buildCssBattleDocument(sourceCode, '', background)
    const score = await scoreCssBattleMarkup(
      targetMarkup,
      submissionMarkup,
      viewportWidth,
      viewportHeight,
    )
    const passed = score >= requiredScore

    results.push({
      passed,
      actual: `${score.toFixed(2)}%`,
      expected: `${requiredScore.toFixed(2)}%`,
      runtime: '0',
      memoryKb: null,
      status: `Similarity ${score.toFixed(2)}%`,
    })
  }

  return results
}

export const Route = createFileRoute('/challenge')({
  validateSearch: challengeSearchSchema,
  component: RouteComponent,
  loader: async () => {
    const user = useUserStore.getState().user
    if (!user) {
      throw redirect({ to: '/' })
    }
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const { id, matchId, imposterMatchId } = Route.useSearch()
  const queryClient = useQueryClient()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const { theme } = useTheme()
  const [selectedLanguage, setSelectedLanguage] =
    useState<EditorLanguage>('javascript')
  const [codeByLanguage, setCodeByLanguage] =
    useState<Record<EditorLanguage, string>>(buildCodeByLanguage)
  const [cssBattleCode, setCssBattleCode] = useState('')
  const [cssBattleComparePosition, setCssBattleComparePosition] = useState(50)
  const [cssBattleCompareDirection, setCssBattleCompareDirection] = useState<
    'horizontal' | 'vertical'
  >('horizontal')
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'content' | 'reviews' | 'chat'
  >('content')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinMatchId, setJoinMatchId] = useState('')
  const [joinImposterDialogOpen, setJoinImposterDialogOpen] = useState(false)
  const [joinImposterMatchId, setJoinImposterMatchId] = useState('')
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState('')
  const [chatDraft, setChatDraft] = useState('')
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({})
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
  const allCases = challenge?.cases ?? []
  const quizQuestions = challenge?.quizQuestions ?? []
  const examples = challenge?.examples ?? []
  const constraints = challenge?.constraints ?? []
  const conditions = challenge?.conditions ?? []
  const code = codeByLanguage[selectedLanguage]
  const isQuizChallenge =
    challenge?.type === 'quiz' || challenge?.type === 'quiz_pvp'
  const isQuizPvpChallenge = challenge?.type === 'quiz_pvp'
  const isPvpChallenge =
    challenge?.type === 'pvp' || challenge?.type === 'quiz_pvp'
  const isImposterChallenge = challenge?.type === 'imposter'
  const isThatsNotMyCoderChallenge = challenge?.type === 'thats_not_my_coder'
  const isCssBattleChallenge = challenge?.type === 'css_battle'
  const testCases = isCssBattleChallenge ? allCases.slice(0, 1) : allCases

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

  const imposterMatchQuery = useQuery({
    queryKey: ['imposter-match', imposterMatchId],
    enabled: isAuthenticated && isImposterChallenge && !!imposterMatchId,
    refetchInterval: (query) =>
      query.state.data &&
      (query.state.data as ImposterMatch).status !== 'finished'
        ? 3000
        : false,
    queryFn: async () => {
      const { data } = await api.get<ImposterMatch>(
        `/imposter-matches/${imposterMatchId}`,
      )
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

  const publicImposterMatchesQuery = useQuery({
    queryKey: ['public-imposter-matches', id],
    enabled: isAuthenticated && isImposterChallenge,
    refetchInterval: 3000,
    queryFn: async () => {
      const { data } = await api.get<ImposterLobbySummary[]>(
        '/imposter-matches/public',
        {
          params: { challengeId: id },
        },
      )
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

  const createImposterMatchMutation = useMutation({
    mutationFn: async (visibility: 'private' | 'public') => {
      const { data } = await api.post<ImposterMatch>('/imposter-matches', {
        challengeId: id,
        visibility,
      })
      return data
    },
    onSuccess: (data) => {
      navigate({ to: '/challenge', search: { id, imposterMatchId: data.id } })
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

  const joinImposterMatchMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data } = await api.post<ImposterMatch>(
        `/imposter-matches/${value}/join`,
      )
      return data
    },
    onSuccess: (data) => {
      setJoinImposterDialogOpen(false)
      setJoinImposterMatchId('')
      navigate({ to: '/challenge', search: { id, imposterMatchId: data.id } })
    },
  })

  const startImposterMatchMutation = useMutation({
    mutationFn: async () => {
      if (!imposterMatchId) {
        throw new Error('No imposter match selected.')
      }

      const { data } = await api.post<ImposterMatch>(
        `/imposter-matches/${imposterMatchId}/start`,
      )
      return data
    },
    onSuccess: () => {
      void imposterMatchQuery.refetch()
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

      const { data } = await api.post<{
        match: Match
        submission: {
          id: string
          userId: string
          language: string
          verdict:
            | 'accepted'
            | 'wrong_answer'
            | 'compilation_error'
            | 'runtime_error'
          passedCount: number
          totalCount: number
          results: TestResult[]
          createdAt: string
        }
      }>(`/matches/${matchId}/submit`, {
        ...(isQuizPvpChallenge
          ? {
              answers: quizAnswers,
            }
          : {
              language: selectedLanguage,
              sourceCode: code,
            }),
      })

      return data
    },
    onSuccess: async (data) => {
      setTestResults(data.submission.results)
      await queryClient.invalidateQueries({
        queryKey: ['challenge-reviews', id],
      })
      void matchQuery.refetch()
    },
  })

  const submitImposterMatchMutation = useMutation({
    mutationFn: async () => {
      if (!imposterMatchId) {
        throw new Error('No imposter match selected.')
      }

      const { data } = await api.post<{
        match: ImposterMatch
        submission: {
          id: string
          userId: string
          language: string
          verdict:
            | 'accepted'
            | 'wrong_answer'
            | 'compilation_error'
            | 'runtime_error'
          passedCount: number
          totalCount: number
          results: TestResult[]
          createdAt: string
        }
      }>(`/imposter-matches/${imposterMatchId}/submit`, {
        language: selectedLanguage,
        sourceCode: code,
      })

      return data
    },
    onSuccess: async (data) => {
      setTestResults(data.submission.results)
      await queryClient.invalidateQueries({
        queryKey: ['challenge-reviews', id],
      })
      void imposterMatchQuery.refetch()
    },
  })

  const voteInImposterMatchMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!imposterMatchId) {
        throw new Error('No imposter match selected.')
      }

      const { data } = await api.post<ImposterMatch>(
        `/imposter-matches/${imposterMatchId}/vote`,
        {
          targetUserId,
        },
      )
      return data
    },
    onSuccess: async () => {
      setSelectedVoteTargetId('')
      void imposterMatchQuery.refetch()
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
        ...(isQuizChallenge
          ? {
              answers: quizAnswers,
            }
          : isCssBattleChallenge
            ? {
                language: 'css',
                sourceCode: cssBattleCode,
              }
            : {
                language: selectedLanguage,
                sourceCode: code,
              }),
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
            { token: 'keyword', foreground: colors.primary },
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
    setCssBattleComparePosition(50)
    setCssBattleCompareDirection('horizontal')
    setCssBattleCode(
      buildCssBattleStarterMarkup(
        getCaseInputValue(challenge?.cases?.[0], 'starterHtml'),
        getCaseInputValue(challenge?.cases?.[0], 'starterCss'),
      ),
    )
    setQuizAnswers(buildInitialQuizAnswers(challenge))
    setActiveSidebarTab('content')
    setChatDraft('')
    setJoinImposterMatchId('')
    setSelectedVoteTargetId('')
    setSeenMatchResultKey(null)
  }, [challenge, id])

  const activeCase = useMemo(
    () => testCases[activeTestCase] ?? null,
    [activeTestCase, testCases],
  )
  const cssBattleTargetHtml = useMemo(
    () => getCaseInputValue(activeCase, 'targetHtml'),
    [activeCase],
  )
  const cssBattleTargetCss = useMemo(
    () => getCaseInputValue(activeCase, 'targetCss'),
    [activeCase],
  )
  const cssBattleStarterHtml = useMemo(
    () => getCaseInputValue(activeCase, 'starterHtml'),
    [activeCase],
  )
  const cssBattleStarterCss = useMemo(
    () => getCaseInputValue(activeCase, 'starterCss'),
    [activeCase],
  )
  const cssBattleBackground = useMemo(
    () =>
      getCaseInputValue(activeCase, 'background') ||
      DEFAULT_CSS_BATTLE_BACKGROUND,
    [activeCase],
  )
  const cssBattleViewportWidth = useMemo(() => {
    const width = Number(getCaseInputValue(activeCase, 'viewportWidth'))
    return Number.isFinite(width) ? width : DEFAULT_CSS_BATTLE_VIEWPORT.width
  }, [activeCase])
  const cssBattleViewportHeight = useMemo(() => {
    const height = Number(getCaseInputValue(activeCase, 'viewportHeight'))
    return Number.isFinite(height) ? height : DEFAULT_CSS_BATTLE_VIEWPORT.height
  }, [activeCase])
  const cssBattleNote = useMemo(
    () => getCaseInputValue(activeCase, 'note'),
    [activeCase],
  )
  const cssBattleTimeLimit = useMemo(
    () => getCaseInputValue(activeCase, 'timeLimit'),
    [activeCase],
  )
  const cssBattlePalette = useMemo(
    () => parseCssBattleColors(getCaseInputValue(activeCase, 'colors')),
    [activeCase],
  )
  const cssBattlePreviewHtml = useMemo(
    () =>
      cssBattleCode ||
      buildCssBattleStarterMarkup(cssBattleStarterHtml, cssBattleStarterCss),
    [cssBattleCode, cssBattleStarterCss, cssBattleStarterHtml],
  )
  const cssBattleRequiredScore = useMemo(() => {
    const value = Number(activeCase?.expectedOutput)
    return Number.isFinite(value) ? value : 100
  }, [activeCase])
  const currentMatch = matchQuery.data
  const currentImposterMatch = imposterMatchQuery.data
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
  const publicImposterMatches = publicImposterMatchesQuery.data ?? []
  const isCurrentUserWinner = currentMatch?.winner?.id === user?.id
  const isCurrentUserLoser =
    !!currentMatch?.winner?.id &&
    currentMatch.winner.id !== user?.id &&
    !!user?.id
  const isCancelledMatch =
    currentMatch?.status === 'finished' && !currentMatch.winnerId
  const endedByAcceptedSubmission = !!winningAcceptedSubmission
  const currentImposterParticipant = currentImposterMatch?.participants.find(
    (participant) => participant.userId === user?.id,
  )
  const currentUserVoteTargetId =
    currentImposterParticipant?.currentUserVoteTargetId ?? null
  const imposterVoteOptions =
    currentImposterMatch?.participants.filter(
      (participant) => participant.userId !== user?.id,
    ) ?? []
  const isImposterUserWinner =
    currentImposterMatch?.status === 'finished' &&
    !!currentImposterMatch.currentUserRole &&
    ((currentImposterMatch.currentUserRole === 'imposter' &&
      currentImposterMatch.winningSide === 'imposter') ||
      (currentImposterMatch.currentUserRole === 'coder' &&
        currentImposterMatch.winningSide === 'coders'))
  const canSubmitToMatch =
    !!currentMatch && currentMatch.status === 'active' && !currentMatch.winnerId
  const canViewChallenge = isPvpChallenge
    ? !!currentMatch && currentMatch.canViewChallenge
    : isImposterChallenge
      ? !!currentImposterMatch && currentImposterMatch.canViewChallenge
      : true
  const canUseMatchChat =
    !!currentMatch &&
    !!currentMatch.playerTwoId &&
    currentMatch.status !== 'waiting' &&
    !!matchId
  const runTestsTooltip = !isAuthenticated
    ? 'Log in to run tests'
    : isQuizChallenge
      ? 'Quiz challenges do not use the code test runner'
      : isCssBattleChallenge
        ? 'Check your similarity score against the target'
        : isPvpChallenge && !canViewChallenge
          ? 'The problem unlocks when both players join the match'
          : isImposterChallenge && !canViewChallenge
            ? 'The problem unlocks once the host starts the imposter lobby'
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
            : isImposterChallenge && !canViewChallenge
              ? 'The host must start the Coders vs Imposter lobby first'
              : isImposterChallenge && !imposterMatchId
                ? 'Create or join a Coders vs Imposter match first'
                : isImposterChallenge &&
                    currentImposterMatch?.status === 'finished'
                  ? 'This match has already finished'
                  : isImposterChallenge &&
                      currentImposterMatch?.status === 'lobby'
                    ? 'The host must start the lobby before submissions open'
                    : submitMatchMutation.isPending
                      ? 'Submitting to the match'
                      : submitImposterMatchMutation.isPending
                        ? 'Submitting to the imposter match'
                        : submitSoloMutation.isPending
                          ? 'Submitting your solution'
                          : !isQuizChallenge && testCases.length === 0
                            ? 'No test cases available'
                            : isQuizChallenge
                              ? 'Submit your selected answers'
                              : isCssBattleChallenge
                                ? 'Submit your CSS/HTML'
                                : 'Submit your solution'
  const lockReason = isPvpChallenge
    ? 'both players join the match'
    : isImposterChallenge
      ? 'the host starts the Coders vs Imposter lobby'
      : 'the challenge is available'

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
          ? currentMatch.challenge.type === 'quiz_pvp'
            ? 'Your fully correct quiz submission finished first and won the match.'
            : 'Your accepted submission finished first and won the match.'
          : 'Your opponent surrendered, so you win by forfeit.',
      })
      setSeenMatchResultKey(resultKey)
      return
    }

    if (isCurrentUserLoser) {
      setMatchResultDialog({
        title: 'You Lost',
        description: endedByAcceptedSubmission
          ? currentMatch.challenge.type === 'quiz_pvp'
            ? `${currentMatch.winner?.username ?? 'Your opponent'} submitted the first fully correct quiz answers.`
            : `${currentMatch.winner?.username ?? 'Your opponent'} submitted the first accepted solution.`
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

  useEffect(() => {
    if (!currentImposterMatch || currentImposterMatch.status !== 'finished') {
      return
    }

    if (!currentImposterMatch.currentUserRole) {
      return
    }

    const resultKey = `imposter:${currentImposterMatch.id}:${
      currentImposterMatch.endedAt ?? currentImposterMatch.updatedAt
    }`

    if (seenMatchResultKey === resultKey) {
      return
    }

    if (isImposterUserWinner) {
      setMatchResultDialog({
        title: 'You Won',
        description:
          currentImposterMatch.currentUserRole === 'imposter'
            ? currentImposterMatch.accusedPlayer
              ? `The coders voted out ${currentImposterMatch.accusedPlayer.username}, and the imposter escaped with the win.`
              : 'The coders failed to coordinate well enough, so the imposter wins.'
            : `${
                currentImposterMatch.acceptedSolver?.username ?? 'A coder'
              } landed an accepted solution and the team exposed ${
                currentImposterMatch.imposter?.username ?? 'the imposter'
              }.`,
      })
      setSeenMatchResultKey(resultKey)
      return
    }

    setMatchResultDialog({
      title: 'You Lost',
      description:
        currentImposterMatch.currentUserRole === 'imposter'
          ? `${
              currentImposterMatch.acceptedSolver?.username ?? 'A coder'
            } landed an accepted solution and the coders correctly identified the imposter.`
          : currentImposterMatch.accusedPlayer
            ? `The team voted out ${
                currentImposterMatch.accusedPlayer.username
              }, while the real imposter was ${
                currentImposterMatch.imposter?.username ?? 'someone else'
              }.`
            : 'The team failed to produce both a correct solution and a clear accusation.',
      variant: 'destructive',
    })
    setSeenMatchResultKey(resultKey)
  }, [currentImposterMatch, isImposterUserWinner, seenMatchResultKey])

  const handleRunTests = async () => {
    if (
      !isAuthenticated ||
      !challenge ||
      !canViewChallenge ||
      isQuizChallenge
    ) {
      return
    }

    if (isCssBattleChallenge) {
      setIsRunning(true)
      try {
        const results = await buildCssBattleResults(
          challenge.cases,
          cssBattleCode,
        )
        setTestResults(results)
      } finally {
        setIsRunning(false)
      }
      return
    }

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

    if (isImposterChallenge) {
      if (!canViewChallenge) {
        setMessageDialog({
          title: 'Lobby Not Started',
          description:
            'The host must start the Coders vs Imposter lobby before submissions unlock.',
        })
        return
      }

      if (!imposterMatchId) {
        setMessageDialog({
          title: 'Match Required',
          description: 'Create or join a Coders vs Imposter match first.',
        })
        return
      }

      if (currentImposterMatch?.status !== 'active') {
        setMessageDialog({
          title: 'Match Not Active',
          description:
            'This Coders vs Imposter match is not accepting submissions right now.',
        })
        return
      }

      try {
        await submitImposterMatchMutation.mutateAsync()
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? Array.isArray(err.response?.data?.message)
            ? err.response.data.message.join(', ')
            : (err.response?.data?.message ??
              'Failed to submit to the imposter match.')
          : err instanceof Error
            ? err.message
            : 'Failed to submit to the imposter match.'
        setMessageDialog({
          title: 'Imposter Match Submission Error',
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
        description: isQuizChallenge
          ? `${submission.passedCount}/${submission.totalCount} quiz questions matched the correct answers.`
          : isCssBattleChallenge
            ? `${submission.passedCount}/${submission.totalCount} cases reached the target score.`
            : `${submission.passedCount}/${submission.totalCount} test cases passed.`,
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

  const handleToggleQuizAnswer = (questionId: string, optionId: string) => {
    setQuizAnswers((current) => {
      const selectedOptions = current[questionId] ?? []
      const nextQuestionAnswers = selectedOptions.includes(optionId)
        ? selectedOptions.filter((value) => value !== optionId)
        : [...selectedOptions, optionId]

      return {
        ...current,
        [questionId]: nextQuestionAnswers,
      }
    })
  }

  const handleCopyMatchId = async () => {
    const activeMatchId = matchId ?? imposterMatchId

    if (!activeMatchId) {
      return
    }

    try {
      await navigator.clipboard.writeText(activeMatchId)
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

  const handleStartImposterMatch = async () => {
    try {
      await startImposterMatchMutation.mutateAsync()
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : (err.response?.data?.message ?? 'Unable to start this match.')
        : err instanceof Error
          ? err.message
          : 'Unable to start this match.'

      setMessageDialog({
        title: 'Start Failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleVoteInImposterMatch = async () => {
    if (!selectedVoteTargetId) {
      return
    }

    try {
      await voteInImposterMatchMutation.mutateAsync(selectedVoteTargetId)
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : (err.response?.data?.message ?? 'Unable to cast your vote.')
        : err instanceof Error
          ? err.message
          : 'Unable to cast your vote.'

      setMessageDialog({
        title: 'Vote Failed',
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
        joinImposterDialogOpen ||
        shortcutsOpen ||
        surrenderConfirmOpen ||
        !!messageDialog ||
        !!matchResultDialog
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

      if (isCopyMatchShortcut && (matchId || imposterMatchId)) {
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
    joinImposterDialogOpen,
    shortcutsOpen,
    surrenderConfirmOpen,
    messageDialog,
    matchResultDialog,
    isAuthenticated,
    canViewChallenge,
    isPvpChallenge,
    isImposterChallenge,
    matchId,
    imposterMatchId,
    selectedLanguage,
    code,
    navigate,
    currentMatch,
    currentImposterMatch,
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

  if (isThatsNotMyCoderChallenge) {
    return (
      <ThatsNotMyCoderChallenge
        challenge={challenge}
        onBack={() => navigate({ to: '/challenges' })}
      />
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
            className="rounded-none"
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
                {(challenge.achievements?.length ?? 0) > 0 ? (
                  <div className="rounded-none border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Linked Achievements
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Completing or mastering this challenge may contribute to
                        these achievement tracks.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {challenge.achievements?.map((achievement) => (
                        <Badge
                          key={achievement.id}
                          variant="outline"
                          className="rounded-none"
                        >
                          {achievement.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(challenge.teams?.length ?? 0) > 0 ? (
                  <div className="rounded-none border border-border/60 bg-background/70 p-4 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Linked Teams
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This challenge is connected to the following teams.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {challenge.teams?.map((team) => (
                        <Badge
                          key={team.id}
                          variant="outline"
                          className="rounded-none"
                        >
                          {team.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

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
                              <Alert className="rounded-none">
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
                              <Alert className="rounded-none">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Match In Progress</AlertTitle>
                                <AlertDescription>
                                  First accepted submission wins this duel.
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {isCurrentUserWinner ? (
                              <Alert className="rounded-none">
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
                              <Alert
                                variant="destructive"
                                className="rounded-none"
                              >
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
                            className="rounded-none"
                          >
                            Copy match ID
                          </Button>
                          <Button
                            type="button"
                            className="rounded-none"
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
                            className="rounded-none"
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
                            className="rounded-none"
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
                            className="rounded-none"
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
                            className="rounded-none"
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
                            className="rounded-none"
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
                                    className="rounded-none"
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
                {isImposterChallenge ? (
                  <div className="rounded-none border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                          Coders vs Imposter
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Gather 3-6 players, start the lobby, submit code, then
                          vote out the suspected imposter.
                        </p>
                      </div>
                      <Badge className="rounded-none bg-primary/10 text-primary uppercase">
                        {currentImposterMatch?.status ?? 'lobby'}
                      </Badge>
                    </div>

                    {imposterMatchId ? (
                      <div className="space-y-3 rounded-none border border-border/60 bg-background/60 p-3">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Match ID
                          </p>
                          <code className="block break-all text-xs text-foreground">
                            {imposterMatchId}
                          </code>
                        </div>

                        {imposterMatchQuery.isError ? (
                          <Alert variant="destructive" className="rounded-none">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Match unavailable</AlertTitle>
                            <AlertDescription>
                              {axios.isAxiosError(imposterMatchQuery.error)
                                ? (imposterMatchQuery.error.response?.data
                                    ?.message ?? 'Unable to load this match.')
                                : 'Unable to load this match.'}
                            </AlertDescription>
                          </Alert>
                        ) : currentImposterMatch ? (
                          <div className="space-y-3 text-xs text-foreground">
                            <p>
                              Visibility:{' '}
                              <span className="font-bold uppercase">
                                {currentImposterMatch.visibility}
                              </span>
                            </p>
                            <p>
                              Players:{' '}
                              <span className="font-bold">
                                {currentImposterMatch.playerCount}/
                                {currentImposterMatch.maxPlayers}
                              </span>
                            </p>

                            {currentImposterMatch.status === 'lobby' ? (
                              <Alert className="rounded-none">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Lobby Open</AlertTitle>
                                <AlertDescription>
                                  The host can start once at least{' '}
                                  {currentImposterMatch.minimumPlayers} players
                                  join.
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {currentImposterMatch.status === 'active' ? (
                              <Alert
                                variant={
                                  currentImposterMatch.currentUserRole ===
                                  'imposter'
                                    ? 'destructive'
                                    : 'default'
                                }
                                className="rounded-none"
                              >
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>
                                  {currentImposterMatch.currentUserRole ===
                                  'imposter'
                                    ? 'You Are The Imposter'
                                    : 'You Are A Coder'}
                                </AlertTitle>
                                <AlertDescription>
                                  {currentImposterMatch.currentUserRole ===
                                  'imposter'
                                    ? 'Prevent the coders from producing an accepted solution or surviving the vote.'
                                    : 'Get an accepted solution and identify the imposter before voting ends.'}
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            {currentImposterMatch.status === 'finished' ? (
                              <Alert
                                variant={
                                  isImposterUserWinner
                                    ? 'default'
                                    : 'destructive'
                                }
                                className="rounded-none"
                              >
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>
                                  {currentImposterMatch.winningSide === 'coders'
                                    ? 'Coders Win'
                                    : 'Imposter Wins'}
                                </AlertTitle>
                                <AlertDescription>
                                  Revealed imposter:{' '}
                                  {currentImposterMatch.imposter?.username ??
                                    'Unknown'}
                                  {currentImposterMatch.accusedPlayer
                                    ? ` · Accused player: ${currentImposterMatch.accusedPlayer.username}`
                                    : ''}
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Participants
                              </p>
                              {currentImposterMatch.participants.map(
                                (participant) => (
                                  <div
                                    key={participant.userId}
                                    className="rounded-none border border-border/60 bg-background/70 p-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold">
                                          {participant.userId === user?.id
                                            ? 'You'
                                            : participant.username}
                                        </span>
                                        {participant.isHost ? (
                                          <Badge
                                            variant="outline"
                                            className="rounded-none"
                                          >
                                            Host
                                          </Badge>
                                        ) : null}
                                        {participant.hasVoted ? (
                                          <Badge
                                            variant="secondary"
                                            className="rounded-none"
                                          >
                                            Voted
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                        {participant.latestSubmission
                                          ? `${participant.latestSubmission.verdict} · ${participant.latestSubmission.passedCount}/${participant.latestSubmission.totalCount}`
                                          : 'No submission yet'}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>

                            {currentImposterMatch.status === 'lobby' &&
                            currentImposterMatch.host?.id === user?.id ? (
                              <Button
                                type="button"
                                className="rounded-none"
                                onClick={() => void handleStartImposterMatch()}
                                disabled={
                                  startImposterMatchMutation.isPending ||
                                  currentImposterMatch.playerCount <
                                    currentImposterMatch.minimumPlayers
                                }
                              >
                                {startImposterMatchMutation.isPending
                                  ? 'Starting...'
                                  : 'Start Match'}
                              </Button>
                            ) : null}

                            {currentImposterMatch.status === 'active' ? (
                              <div className="space-y-3 rounded-none border border-border/60 bg-background/70 p-3">
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                    Voting
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {currentUserVoteTargetId
                                      ? `You already voted for ${
                                          imposterVoteOptions.find(
                                            (participant) =>
                                              participant.userId ===
                                              currentUserVoteTargetId,
                                          )?.username ?? 'another player'
                                        }.`
                                      : 'Cast your one vote when you are ready. The match resolves when everyone votes.'}
                                  </p>
                                </div>
                                {!currentUserVoteTargetId ? (
                                  <div className="flex flex-col gap-3 sm:flex-row">
                                    <Select
                                      value={selectedVoteTargetId}
                                      onValueChange={setSelectedVoteTargetId}
                                    >
                                      <SelectTrigger className="w-full rounded-none sm:w-56">
                                        <SelectValue placeholder="Select a suspect" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {imposterVoteOptions.map(
                                          (participant) => (
                                            <SelectItem
                                              key={participant.userId}
                                              value={participant.userId}
                                            >
                                              {participant.username}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      type="button"
                                      className="rounded-none"
                                      disabled={
                                        !selectedVoteTargetId ||
                                        voteInImposterMatchMutation.isPending
                                      }
                                      onClick={() =>
                                        void handleVoteInImposterMatch()
                                      }
                                    >
                                      {voteInImposterMatchMutation.isPending
                                        ? 'Voting...'
                                        : 'Cast Vote'}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
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
                            className="rounded-none"
                            onClick={() => void handleCopyMatchId()}
                          >
                            Copy match ID
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-none"
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
                            className="rounded-none"
                            onClick={() =>
                              createImposterMatchMutation.mutate('private')
                            }
                            disabled={
                              !isAuthenticated ||
                              createImposterMatchMutation.isPending
                            }
                          >
                            {createImposterMatchMutation.isPending
                              ? 'Creating...'
                              : 'Create Private Match'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-none"
                            onClick={() =>
                              createImposterMatchMutation.mutate('public')
                            }
                            disabled={
                              !isAuthenticated ||
                              createImposterMatchMutation.isPending
                            }
                          >
                            {createImposterMatchMutation.isPending
                              ? 'Creating...'
                              : 'Create Public Match'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-none"
                            onClick={() => setJoinImposterDialogOpen(true)}
                            disabled={
                              !isAuthenticated ||
                              joinImposterMatchMutation.isPending
                            }
                          >
                            Join by ID
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Swords className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                              Public Lobbies
                            </p>
                          </div>
                          {publicImposterMatchesQuery.isLoading ? (
                            <p className="text-xs text-muted-foreground">
                              Loading public lobbies...
                            </p>
                          ) : publicImposterMatchesQuery.isError ? (
                            <p className="text-xs text-destructive">
                              Unable to load public lobbies right now.
                            </p>
                          ) : publicImposterMatches.length > 0 ? (
                            <div className="space-y-2">
                              {publicImposterMatches.map((match) => (
                                <div
                                  key={match.id}
                                  className="flex flex-col gap-2 rounded-none border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="space-y-1">
                                    <p className="text-xs text-foreground">
                                      Host:{' '}
                                      <span className="font-bold">
                                        {match.host?.username ?? 'Unknown'}
                                      </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Players: {match.playerCount}/
                                      {match.maxPlayers}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                      Match ID: {match.id}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    className="rounded-none"
                                    size="sm"
                                    onClick={() => {
                                      if (match.isJoinedByCurrentUser) {
                                        navigate({
                                          to: '/challenge',
                                          search: {
                                            id,
                                            imposterMatchId: match.id,
                                          },
                                        })
                                        return
                                      }

                                      joinImposterMatchMutation.mutate(match.id)
                                    }}
                                    disabled={
                                      !match.isJoinedByCurrentUser &&
                                      joinImposterMatchMutation.isPending
                                    }
                                  >
                                    {match.isJoinedByCurrentUser
                                      ? 'Open'
                                      : 'Join'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No public imposter lobbies yet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
                {!isCssBattleChallenge ? (
                  <>
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
                          .map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))
                      ) : (
                        <p className="text-muted-foreground">
                          The challenge briefing is hidden until {lockReason}.
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
                            unlock once {lockReason}.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="rounded-none border border-foreground/5 bg-foreground/2 p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rarity-legendary">
                          <AlertCircle className="w-4 h-4" />
                          <h1 className="text-xs font-bold uppercase tracking-widest">
                            Constraints
                          </h1>
                        </div>
                        {canViewChallenge ? (
                          <ul className="space-y-2 font-mono text-[12px] text-foreground">
                            {constraints.length > 0 ? (
                              constraints.map((constraint, index) => (
                                <li key={`${constraint}-${index}`}>
                                  {constraint}
                                </li>
                              ))
                            ) : (
                              <li className="text-muted-foreground">
                                No constraints provided.
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Constraints are hidden until {lockReason}.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-none border border-foreground/5 bg-foreground/2 p-6 space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-4 h-4" />
                        <h1 className="text-xs font-bold uppercase tracking-widest">
                          Victory Conditions
                        </h1>
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
                          Victory conditions are hidden until {lockReason}.
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
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
                aria-label="acceptance rate"
              />
            </div>
          ) : null}
        </aside>

        <main className="relative flex flex-1 flex-col bg-background">
          {isCssBattleChallenge ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3">
                <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  CSS Battle
                </span>
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
                          {isRunning ? 'CHECKING...' : 'CHECK SCORE'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p>{runTestsTooltip}</p>
                        <p>`Ctrl/Cmd+Shift+Enter` checks score</p>
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
                            submitImposterMatchMutation.isPending ||
                            submitSoloMutation.isPending
                          }
                          onClick={handleSubmit}
                          aria-keyshortcuts="Control+Enter Meta+Enter"
                          className="h-10 w-full rounded-none bg-primary px-8 text-xs font-bold gap-2 text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] disabled:opacity-50 sm:w-auto"
                        >
                          <Send className="w-3 h-3" />
                          {submitMatchMutation.isPending ||
                          submitImposterMatchMutation.isPending ||
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
                      Guests can view the target, but checking scores and
                      submitting CSS requires a signed-in account.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_460px]">
                <div className="min-h-0 flex flex-col">
                  <div className="border-b border-border bg-muted/10 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Target Brief
                        </div>
                        <div className="text-sm text-foreground">
                          {challenge.title}
                        </div>
                        {cssBattleNote ? (
                          <p className="text-xs text-muted-foreground">
                            {cssBattleNote}
                          </p>
                        ) : null}
                        {cssBattlePalette.length > 0 ? (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Palette
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {cssBattlePalette.map((color, index) => (
                                <div
                                  key={`${color}-${index}`}
                                  className="inline-flex items-center gap-2 rounded-none border border-border bg-background px-2 py-1"
                                >
                                  <span
                                    className="h-3 w-3 rounded-none border border-border"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {color}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                        {cssBattleTimeLimit ? (
                          <div>Time {cssBattleTimeLimit}s</div>
                        ) : null}
                        <div>
                          Target score {cssBattleRequiredScore.toFixed(0)}%
                        </div>
                        <div>
                          Viewport {cssBattleViewportWidth}x
                          {cssBattleViewportHeight}
                        </div>
                      </div>
                    </div>
                  </div>
                  {canViewChallenge ? (
                    <div className="min-h-88 flex-1">
                      <Editor
                        key={`${id}-css-battle`}
                        path={`challenge-${id}/css-battle.html`}
                        language="html"
                        options={{
                          minimap: { enabled: true },
                          padding: { top: 24 },
                          readOnly: false,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                        value={cssBattleCode}
                        onChange={(value) => setCssBattleCode(value || '')}
                        theme="lockin-theme"
                        loading={
                          <div className="h-full w-full animate-pulse bg-background" />
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
                          The editor unlocks once {lockReason}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-border bg-background lg:border-l lg:border-t-0">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Preview & Similarity
                    </h3>
                  </div>
                  <div className="space-y-4 p-4">
                    {canViewChallenge ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span>Your Output</span>
                            <span className="font-normal text-[9px] tracking-normal uppercase">
                              {cssBattleCompareDirection === 'horizontal'
                                ? 'Left → Right'
                                : 'Top → Bottom'}{' '}
                              • Hold Shift to switch
                            </span>
                          </div>
                          {cssBattleTargetHtml &&
                          cssBattleTargetCss &&
                          cssBattlePreviewHtml ? (
                            <div
                              className="relative w-full overflow-hidden rounded-none border border-border bg-background"
                              style={{ height: cssBattleViewportHeight }}
                              onMouseMove={(event) => {
                                const rect =
                                  event.currentTarget.getBoundingClientRect()
                                const horizontal =
                                  ((event.clientX - rect.left) / rect.width) *
                                  100
                                const vertical =
                                  ((event.clientY - rect.top) / rect.height) *
                                  100
                                const nextDirection = event.shiftKey
                                  ? 'vertical'
                                  : 'horizontal'

                                setCssBattleCompareDirection(nextDirection)
                                setCssBattleComparePosition(
                                  Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      nextDirection === 'horizontal'
                                        ? horizontal
                                        : vertical,
                                    ),
                                  ),
                                )
                              }}
                            >
                              <iframe
                                title="CSS battle output target base"
                                className="pointer-events-none absolute inset-0 h-full w-full"
                                sandbox=""
                                srcDoc={buildCssBattleDocument(
                                  cssBattleTargetHtml,
                                  cssBattleTargetCss,
                                  cssBattleBackground,
                                )}
                              />
                              <iframe
                                title="CSS battle output overlay"
                                className="pointer-events-none absolute inset-0 h-full w-full"
                                sandbox=""
                                style={{
                                  clipPath:
                                    cssBattleCompareDirection === 'horizontal'
                                      ? `inset(0 ${100 - cssBattleComparePosition}% 0 0)`
                                      : `inset(0 0 ${100 - cssBattleComparePosition}% 0)`,
                                }}
                                srcDoc={buildCssBattleDocument(
                                  cssBattlePreviewHtml,
                                  '',
                                  cssBattleBackground,
                                )}
                              />
                              <div
                                className="pointer-events-none absolute bg-primary/90"
                                style={
                                  cssBattleCompareDirection === 'horizontal'
                                    ? {
                                        left: `${cssBattleComparePosition}%`,
                                        top: 0,
                                        bottom: 0,
                                        width: '2px',
                                        transform: 'translateX(-1px)',
                                      }
                                    : {
                                        top: `${cssBattleComparePosition}%`,
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        transform: 'translateY(-1px)',
                                      }
                                }
                              />
                            </div>
                          ) : cssBattlePreviewHtml ? (
                            <iframe
                              title="CSS battle output"
                              className="w-full rounded-none border border-border bg-background"
                              sandbox=""
                              style={{ height: cssBattleViewportHeight }}
                              srcDoc={buildCssBattleDocument(
                                cssBattlePreviewHtml,
                                '',
                                cssBattleBackground,
                              )}
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Start writing HTML/CSS to preview.
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Target
                          </div>
                          {cssBattleTargetHtml && cssBattleTargetCss ? (
                            <iframe
                              title="CSS battle target"
                              className="w-full rounded-none border border-border bg-background"
                              sandbox=""
                              style={{ height: cssBattleViewportHeight }}
                              srcDoc={buildCssBattleDocument(
                                cssBattleTargetHtml,
                                cssBattleTargetCss,
                                cssBattleBackground,
                              )}
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Target HTML/CSS missing for this case.
                            </div>
                          )}
                        </div>
                        <div className="rounded-none border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                          Target score: {cssBattleRequiredScore.toFixed(0)}%
                        </div>

                        {testResults[activeTestCase] ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase text-muted-foreground">
                                  Actual
                                </span>
                                <div
                                  className={`rounded border p-3 font-bold ${
                                    testResults[activeTestCase].passed
                                      ? 'border-green-500/20 bg-green-500/5 text-green-500'
                                      : 'border-destructive/20 bg-destructive/5 text-destructive'
                                  }`}
                                >
                                  {testResults[activeTestCase].actual}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase text-muted-foreground">
                                  Expected
                                </span>
                                <div className="rounded border border-border bg-muted/30 p-3 text-foreground">
                                  {testResults[activeTestCase].expected}
                                </div>
                              </div>
                            </div>
                            {testResults[activeTestCase].status ? (
                              <div className="rounded border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                                {testResults[activeTestCase].status}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="rounded-none border border-dashed border-border bg-muted/5 p-6 text-center">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Check score to review case results.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Preview unlocks once {lockReason}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : isQuizChallenge ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3">
                <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Quiz Submission
                </span>
                {quizQuestions.map((question, index) => (
                  <Button
                    key={question.id}
                    onClick={() => setActiveTestCase(index)}
                    variant={activeTestCase === index ? 'default' : 'secondary'}
                    className="h-9 rounded-none font-bold"
                  >
                    Q{index + 1}
                  </Button>
                ))}
                <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="w-full sm:w-auto">
                        <Button
                          disabled={
                            !isAuthenticated ||
                            quizQuestions.length === 0 ||
                            !canViewChallenge ||
                            submitMatchMutation.isPending ||
                            submitImposterMatchMutation.isPending ||
                            submitSoloMutation.isPending
                          }
                          onClick={handleSubmit}
                          aria-keyshortcuts="Control+Enter Meta+Enter"
                          className="h-10 w-full rounded-none bg-primary px-8 text-xs font-bold gap-2 text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] disabled:opacity-50 sm:w-auto"
                        >
                          <Send className="w-3 h-3" />
                          {submitMatchMutation.isPending ||
                          submitImposterMatchMutation.isPending ||
                          submitSoloMutation.isPending
                            ? 'SUBMITTING...'
                            : 'SUBMIT ANSWERS'}
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
                      Guests can read the quiz, but submitting answers requires
                      a signed-in account.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1.2fr)_420px]">
                <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                  {canViewChallenge ? (
                    quizQuestions.length > 0 ? (
                      <div className="space-y-6">
                        {quizQuestions.map((question, questionIndex) => {
                          const selectedOptions = quizAnswers[question.id] ?? []

                          return (
                            <section
                              key={question.id}
                              className="space-y-4 rounded-none border border-border bg-card/30 p-4"
                            >
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                  Question {questionIndex + 1}
                                </div>
                                <h3 className="text-base font-semibold text-foreground">
                                  {question.prompt}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Multiple answers may be correct.
                                </p>
                              </div>
                              <div className="space-y-3">
                                {question.options.map((option) => {
                                  const inputId = `quiz-${question.id}-${option.id}`
                                  const checked = selectedOptions.includes(
                                    option.id,
                                  )

                                  return (
                                    <label
                                      key={option.id}
                                      htmlFor={inputId}
                                      className="flex cursor-pointer items-start gap-3 rounded-none border border-border bg-background/60 p-3 text-sm text-foreground transition-colors hover:border-primary/40"
                                    >
                                      <input
                                        id={inputId}
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 accent-primary"
                                        checked={checked}
                                        onChange={() =>
                                          handleToggleQuizAnswer(
                                            question.id,
                                            option.id,
                                          )
                                        }
                                      />
                                      <span>{option.text}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </section>
                          )
                        })}
                      </div>
                    ) : (
                      <Alert className="rounded-none">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No quiz questions</AlertTitle>
                        <AlertDescription>
                          This quiz challenge does not have any questions
                          configured yet.
                        </AlertDescription>
                      </Alert>
                    )
                  ) : (
                    <div className="flex min-h-full items-center justify-center rounded-none border border-dashed border-border bg-muted/5 p-6 text-center">
                      <div className="max-w-md space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                          Quiz Locked
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          The quiz unlocks once {lockReason}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-border bg-background lg:border-l lg:border-t-0">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Answer Review
                    </h3>
                  </div>
                  <div className="space-y-4 p-4 font-mono sm:p-6">
                    {testResults[activeTestCase] ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase text-muted-foreground">
                            Your Selection
                          </span>
                          <div
                            className={`rounded border p-3 font-bold ${
                              testResults[activeTestCase].passed
                                ? 'border-green-500/20 bg-green-500/5 text-green-500'
                                : 'border-destructive/20 bg-destructive/5 text-destructive'
                            }`}
                          >
                            {testResults[activeTestCase].actual}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase text-muted-foreground">
                            Correct Answers
                          </span>
                          <div className="rounded border border-border bg-muted/30 p-3 text-foreground">
                            {testResults[activeTestCase].expected}
                          </div>
                        </div>
                        <div className="rounded border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                          {testResults[activeTestCase].status}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-none border border-dashed border-border bg-muted/5 p-6 text-center">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          Submit your answers to review each question.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                        <div className="h-full w-full animate-pulse bg-background" />
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
                        The code editor unlocks once {lockReason}.
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
                      variant={
                        activeTestCase === index ? 'default' : 'secondary'
                      }
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
                              submitImposterMatchMutation.isPending ||
                              submitSoloMutation.isPending
                            }
                            onClick={handleSubmit}
                            aria-keyshortcuts="Control+Enter Meta+Enter"
                            className="h-10 w-full rounded-none bg-primary px-8 text-xs font-bold gap-2 text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] disabled:opacity-50 sm:w-auto"
                          >
                            <Send className="w-3 h-3" />{' '}
                            {submitMatchMutation.isPending ||
                            submitImposterMatchMutation.isPending ||
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
                          Test inputs unlock once {lockReason}.
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
                                Memory: {testResults[activeTestCase].memoryKb}{' '}
                                KB
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
                          <p className="text-[11px] text-foreground uppercase tracking-widest">
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
            </>
          )}

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
                <h1 className="text-[10px] font-bold text-foreground leading-none">
                  NEON DRAGON
                </h1>
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

      <Dialog
        open={joinImposterDialogOpen}
        onOpenChange={setJoinImposterDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Coders vs Imposter Match</DialogTitle>
            <DialogDescription>
              Paste a match ID for this challenge to join the hidden-role lobby.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="join-imposter-match-id">Match ID</Label>
            <Input
              id="join-imposter-match-id"
              value={joinImposterMatchId}
              onChange={(event) => setJoinImposterMatchId(event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          {joinImposterMatchMutation.isError ? (
            <Alert variant="destructive" className="rounded-none">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Join failed</AlertTitle>
              <AlertDescription>
                {axios.isAxiosError(joinImposterMatchMutation.error)
                  ? (joinImposterMatchMutation.error.response?.data?.message ??
                    'Unable to join this match.')
                  : 'Unable to join this match.'}
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setJoinImposterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                joinImposterMatchMutation.mutate(joinImposterMatchId.trim())
              }
              disabled={
                !joinImposterMatchId.trim() ||
                joinImposterMatchMutation.isPending
              }
            >
              {joinImposterMatchMutation.isPending
                ? 'Joining...'
                : 'Join match'}
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

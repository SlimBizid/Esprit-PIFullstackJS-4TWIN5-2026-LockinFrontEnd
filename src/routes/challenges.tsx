import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Search,
  Flame,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Pencil,
  Plus,
  Trash2,
  Swords,
  Star,
  TrendingUp,
} from 'lucide-react'
import { api } from '@/stores/userStore'
import { useIsAdmin, useIsAuthenticated } from '@/stores/userStore'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Challenge } from '@/models/challenge'
import type { ChallengeCase } from '@/models/challenge'
import type { ChallengeQuizQuestion } from '@/models/challenge'
import type { Match } from '@/models/match'
import type { PaginatedChallenges } from '@/models/paginated-challenge'
import type { RecommendationResponse } from '@/models/recommendation'

const ITEMS_PER_PAGE = 10
const FETCH_LIMIT = 100
const CHALLENGE_TOPICS = [
  'Array',
  'String',
  'Hash Table',
  'Linked List',
  'Stack',
  'Queue',
  'Heap (Priority Queue)',
  'Tree',
  'Binary Tree',
  'Binary Search Tree',
  'Graph',
  'Trie',
  'Union Find',
  'Sorting',
  'Searching',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Backtracking',
  'Dynamic Programming',
  'Greedy',
  'Math',
  'Bit Manipulation',
  'Recursion',
  'Memoization',
  'Depth-First Search',
  'Breadth-First Search',
  'Topological Sort',
  'Shortest Path',
  'Matrix',
  'Prefix Sum',
  'Segment Tree',
  'Binary Indexed Tree',
  'Geometry',
  'Database',
  'Shell',
  'Concurrency',
  'Ordered Set',
  'Monotonic Stack',
  'Enumeration',
] as const
const EDITOR_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
] as const
type EditorLanguage = (typeof EDITOR_LANGUAGES)[number]

type ChallengeFormValues = {
  title: string
  content: string
  starterCode: string
  starterCodes: Record<EditorLanguage, string>
  difficulty: Challenge['difficulty']
  type: Challenge['type']
  topics: string[]
  acceptanceRate: string
  examples: string
  constraints: string
  conditions: string
  testCases: string
  quizQuestions: string
}

type ChallengePayload = {
  title: string
  content: string
  starterCode: string
  starterCodes: Record<EditorLanguage, string>
  difficulty: Challenge['difficulty']
  type: Challenge['type']
  topics: string[]
  acceptanceRate: number
  examples: string[]
  constraints: string[]
  conditions: string[]
  cases: ChallengeCase[]
  quizQuestions: ChallengeQuizQuestion[]
}

type GeneratedChallengeDraft = {
  title: string
  content: string
  starterCode: string
  starterCodes: Partial<Record<EditorLanguage, string>>
  difficulty: Challenge['difficulty']
  type: Challenge['type']
  topics: string[]
  acceptanceRate: number
  examples: string[]
  constraints: string[]
  conditions: string[]
  cases: ChallengeCase[]
  quizQuestions: ChallengeQuizQuestion[]
}

type CssBattleCaseForm = {
  note: string
  viewportWidth: string
  viewportHeight: string
  colors: string[]
  starterHtml: string
  starterCss: string
  targetHtml: string
  targetCss: string
  expectedOutput: string
}

type ThatsNotMyCoderCaseForm = {
  title: string
  author: string
  language: string
  note: string
  rationale: string
  timeLimit: string
  code: string
  expectedOutput: 'accept' | 'deny'
}

const DEFAULT_CSS_BATTLE_CASE: CssBattleCaseForm = {
  note: '',
  viewportWidth: '400',
  viewportHeight: '300',
  colors: ['#ffffff'],
  starterHtml: '',
  starterCss: '',
  targetHtml: '',
  targetCss: '',
  expectedOutput: '100',
}

const DEFAULT_TNMC_CASE: ThatsNotMyCoderCaseForm = {
  title: '',
  author: '',
  language: 'typescript',
  note: '',
  rationale: '',
  timeLimit: '15',
  code: '',
  expectedOutput: 'deny',
}

function updateCachedChallenges(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (current: Challenge[]) => Challenge[],
) {
  queryClient.setQueryData<PaginatedChallenges>(['challenges'], (current) => {
    if (!current) return current

    const nextData = updater(current.data)

    return {
      ...current,
      data: nextData,
      meta: {
        ...current.meta,
        totalItems: nextData.length,
        itemCount: nextData.length,
      },
    }
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (!axios.isAxiosError(error)) {
    return 'Failed to load challenges.'
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (error.response?.status === 401) {
    return 'Log in first to load the challenge list.'
  }

  return 'Failed to load challenges.'
}

function formatDifficulty(difficulty: Challenge['difficulty']) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function formatType(type: Challenge['type']) {
  switch (type) {
    case 'pvp':
      return '1v1'
    case 'quiz':
      return 'Quiz'
    case 'quiz_pvp':
      return 'Quiz 1v1'
    case 'imposter':
      return 'Coders vs Imposter'
    case 'thats_not_my_coder':
      return "That's Not My Coder"
    case 'css_battle':
      return 'CSS Battle'
    case 'solo':
      return 'Solo'
    case 'teams':
      return 'Teams'
    default:
      return type
  }
}

function getDefaultFormValues(challenge?: Challenge): ChallengeFormValues {
  const starterCodes: Record<EditorLanguage, string> = {
    javascript:
      challenge?.starterCodes?.javascript ?? challenge?.starterCode ?? '',
    typescript: challenge?.starterCodes?.typescript ?? '',
    python: challenge?.starterCodes?.python ?? '',
    java: challenge?.starterCodes?.java ?? '',
    cpp: challenge?.starterCodes?.cpp ?? '',
  }

  return {
    title: challenge?.title ?? '',
    content: challenge?.content ?? '',
    starterCode: starterCodes.javascript,
    starterCodes,
    difficulty: challenge?.difficulty ?? 'easy',
    type: challenge?.type ?? 'solo',
    topics: challenge?.topics ?? [],
    acceptanceRate: challenge ? String(challenge.acceptanceRate) : '100',
    examples: challenge?.examples.join('\n') ?? '',
    constraints: challenge?.constraints.join('\n') ?? '',
    conditions: challenge?.conditions.join('\n') ?? '',
    testCases:
      challenge?.cases && challenge.cases.length > 0
        ? JSON.stringify(challenge.cases, null, 2)
        : '',
    quizQuestions:
      challenge?.quizQuestions && challenge.quizQuestions.length > 0
        ? JSON.stringify(challenge.quizQuestions, null, 2)
        : '',
  }
}

function splitMultiline(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseChallengeCases(value: string): ChallengeCase[] {
  const trimmed = value.trim()

  if (!trimmed) {
    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('Test cases must be valid JSON.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Test cases must be a JSON array.')
  }

  return parsed.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Test case ${index + 1} must be an object.`)
    }

    const testCase = item as {
      inputs?: unknown
      expectedOutput?: unknown
    }

    if (!Array.isArray(testCase.inputs)) {
      throw new Error(`Test case ${index + 1} must include an inputs array.`)
    }

    const inputs = testCase.inputs.map((input, inputIndex) => {
      if (typeof input !== 'object' || input === null) {
        throw new Error(
          `Input ${inputIndex + 1} in test case ${index + 1} must be an object.`,
        )
      }

      const challengeInput = input as {
        type?: unknown
        value?: unknown
      }

      if (
        typeof challengeInput.type !== 'string' ||
        !challengeInput.type.trim()
      ) {
        throw new Error(
          `Input ${inputIndex + 1} in test case ${index + 1} must include a string type.`,
        )
      }

      if (typeof challengeInput.value !== 'string') {
        throw new Error(
          `Input ${inputIndex + 1} in test case ${index + 1} must include a string value.`,
        )
      }

      return {
        type: challengeInput.type.trim(),
        value: challengeInput.value,
      }
    })

    if (typeof testCase.expectedOutput !== 'string') {
      throw new Error(
        `Test case ${index + 1} must include a string expectedOutput.`,
      )
    }

    return {
      inputs,
      expectedOutput: testCase.expectedOutput,
    }
  })
}

function safeParseChallengeCases(value: string) {
  try {
    return parseChallengeCases(value)
  } catch {
    return [] as ChallengeCase[]
  }
}

function parseCaseColorArray(rawValue: string) {
  const trimmed = rawValue.trim()

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

function mapCasesToCssBattleForms(cases: ChallengeCase[]): CssBattleCaseForm[] {
  const mapped = cases.map((testCase) => {
    const getInput = (type: string) =>
      testCase.inputs.find((input) => input.type === type)?.value ?? ''

    const rawColors = getInput('colors')
    const parsedColors = parseCaseColorArray(rawColors)
    const fallbackBackground = getInput('background')
    const colors =
      parsedColors.length > 0
        ? parsedColors
        : fallbackBackground.trim().length > 0
          ? [fallbackBackground.trim()]
          : ['#ffffff']

    return {
      note: getInput('note'),
      viewportWidth: getInput('viewportWidth'),
      viewportHeight: getInput('viewportHeight'),
      colors,
      starterHtml: getInput('starterHtml'),
      starterCss: getInput('starterCss'),
      targetHtml: getInput('targetHtml'),
      targetCss: getInput('targetCss'),
      expectedOutput: testCase.expectedOutput ?? '100',
    }
  })

  return mapped.length > 0 ? [mapped[0]] : [DEFAULT_CSS_BATTLE_CASE]
}

function mapCssBattleFormsToCases(forms: CssBattleCaseForm[]): ChallengeCase[] {
  return forms.map((form) => {
    const colors = form.colors
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)

    const inputs = [
      { type: 'note', value: form.note.trim() },
      { type: 'viewportWidth', value: form.viewportWidth.trim() },
      { type: 'viewportHeight', value: form.viewportHeight.trim() },
      {
        type: 'colors',
        value: colors.length > 0 ? JSON.stringify(colors) : '',
      },
      { type: 'starterHtml', value: form.starterHtml },
      { type: 'starterCss', value: form.starterCss },
      { type: 'targetHtml', value: form.targetHtml },
      { type: 'targetCss', value: form.targetCss },
    ].filter((input) => input.value.length > 0)

    return {
      inputs,
      expectedOutput: form.expectedOutput.trim() || '100',
    }
  })
}

function mapCasesToThatsNotMyCoderForms(
  cases: ChallengeCase[],
): ThatsNotMyCoderCaseForm[] {
  const mapped = cases.map((testCase) => {
    const getInput = (type: string) =>
      testCase.inputs.find((input) => input.type === type)?.value ?? ''

    const normalizedExpected = testCase.expectedOutput.trim().toLowerCase()
    const expectedOutput: 'accept' | 'deny' =
      normalizedExpected === 'accept' ? 'accept' : 'deny'

    return {
      title: getInput('title'),
      author: getInput('author'),
      language: getInput('language') || 'typescript',
      note: getInput('note'),
      rationale: getInput('rationale'),
      timeLimit: getInput('timeLimit') || '15',
      code: getInput('code'),
      expectedOutput,
    }
  })

  return mapped.length > 0 ? mapped : [DEFAULT_TNMC_CASE]
}

function mapThatsNotMyCoderFormsToCases(
  forms: ThatsNotMyCoderCaseForm[],
): ChallengeCase[] {
  return forms.map((form) => {
    const inputs = [
      { type: 'title', value: form.title.trim() },
      { type: 'author', value: form.author.trim() },
      { type: 'language', value: form.language.trim() },
      { type: 'note', value: form.note.trim() },
      { type: 'rationale', value: form.rationale.trim() },
      { type: 'timeLimit', value: form.timeLimit.trim() },
      { type: 'code', value: form.code },
    ].filter((input) => input.value.length > 0)

    return {
      inputs,
      expectedOutput: form.expectedOutput,
    }
  })
}

function parseQuizQuestions(value: string): ChallengeQuizQuestion[] {
  const trimmed = value.trim()

  if (!trimmed) {
    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('Quiz questions must be valid JSON.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Quiz questions must be a JSON array.')
  }

  return parsed.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Quiz question ${index + 1} must be an object.`)
    }

    const question = item as {
      id?: unknown
      prompt?: unknown
      options?: unknown
      correctOptionIds?: unknown
      explanation?: unknown
    }

    if (typeof question.id !== 'string' || !question.id.trim()) {
      throw new Error(`Quiz question ${index + 1} must include a string id.`)
    }

    if (typeof question.prompt !== 'string' || !question.prompt.trim()) {
      throw new Error(
        `Quiz question ${index + 1} must include a string prompt.`,
      )
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error(
        `Quiz question ${index + 1} must include at least two options.`,
      )
    }

    const options = question.options.map((option, optionIndex) => {
      if (typeof option !== 'object' || option === null) {
        throw new Error(
          `Option ${optionIndex + 1} in quiz question ${index + 1} must be an object.`,
        )
      }

      const quizOption = option as {
        id?: unknown
        text?: unknown
      }

      if (typeof quizOption.id !== 'string' || !quizOption.id.trim()) {
        throw new Error(
          `Option ${optionIndex + 1} in quiz question ${index + 1} must include a string id.`,
        )
      }

      if (typeof quizOption.text !== 'string' || !quizOption.text.trim()) {
        throw new Error(
          `Option ${optionIndex + 1} in quiz question ${index + 1} must include display text.`,
        )
      }

      return {
        id: quizOption.id.trim(),
        text: quizOption.text.trim(),
      }
    })

    if (
      !Array.isArray(question.correctOptionIds) ||
      question.correctOptionIds.length === 0 ||
      question.correctOptionIds.some((value) => typeof value !== 'string')
    ) {
      throw new Error(
        `Quiz question ${index + 1} must include one or more correctOptionIds.`,
      )
    }

    return {
      id: question.id.trim(),
      prompt: question.prompt.trim(),
      options,
      correctOptionIds: question.correctOptionIds as string[],
      explanation:
        typeof question.explanation === 'string' &&
        question.explanation.trim().length > 0
          ? question.explanation.trim()
          : undefined,
    }
  })
}

function buildChallengePayload(values: ChallengeFormValues): ChallengePayload {
  const parsedAcceptanceRate = Number(values.acceptanceRate)
  const isQuizType = values.type === 'quiz' || values.type === 'quiz_pvp'
  const isThatsNotMyCoderType = values.type === 'thats_not_my_coder'
  const isCssBattleType = values.type === 'css_battle'
  const shouldIncludeStarterCode =
    !isQuizType && !isThatsNotMyCoderType && !isCssBattleType
  const isCustomNoMetaType = isThatsNotMyCoderType || isCssBattleType
  const fallbackContent = 'Match the target layout using HTML/CSS only.'
  const fallbackTopic = CHALLENGE_TOPICS.includes(
    'Math' as (typeof CHALLENGE_TOPICS)[number],
  )
    ? 'Math'
    : CHALLENGE_TOPICS[0]

  return {
    title: values.title.trim(),
    content: isCssBattleType
      ? values.content.trim() || fallbackContent
      : values.content.trim(),
    starterCode: shouldIncludeStarterCode ? values.starterCodes.javascript : '',
    starterCodes: shouldIncludeStarterCode
      ? values.starterCodes
      : {
          javascript: '',
          typescript: '',
          python: '',
          java: '',
          cpp: '',
        },
    difficulty: values.difficulty,
    type: values.type,
    topics: isCustomNoMetaType
      ? values.topics.length > 0
        ? values.topics
        : [fallbackTopic]
      : values.topics,
    acceptanceRate: Number.isFinite(parsedAcceptanceRate)
      ? parsedAcceptanceRate
      : 100,
    examples: isThatsNotMyCoderType ? [] : splitMultiline(values.examples),
    constraints: isThatsNotMyCoderType
      ? []
      : splitMultiline(values.constraints),
    conditions: isThatsNotMyCoderType ? [] : splitMultiline(values.conditions),
    cases: isQuizType ? [] : parseChallengeCases(values.testCases),
    quizQuestions: isQuizType ? parseQuizQuestions(values.quizQuestions) : [],
  }
}

function getTestCasesLabel(type: Challenge['type']) {
  if (type === 'thats_not_my_coder') {
    return 'Review Cases'
  }

  if (type === 'css_battle') {
    return 'Battle Cases'
  }

  return 'Test Cases'
}

function getTestCasesPlaceholder(type: Challenge['type']) {
  if (type === 'thats_not_my_coder') {
    return `[
  {
    "inputs": [
      { "type": "title", "value": "Rate limiter patch" },
      { "type": "author", "value": "suspicious_commit_bot" },
      { "type": "language", "value": "typescript" },
      { "type": "note", "value": "The patch looks fast, but does it belong in production?" },
      { "type": "rationale", "value": "Uses an always-true condition and silently bypasses auth checks." },
      { "type": "timeLimit", "value": "12" },
      { "type": "code", "value": "export function isAdmin(user) {\\n  return true\\n}" }
    ],
    "expectedOutput": "deny"
  }
]`
  }

  if (type === 'css_battle') {
    return `[
  {
    "inputs": [
      { "type": "note", "value": "Match the target using HTML/CSS only." },
      { "type": "viewportWidth", "value": "400" },
      { "type": "viewportHeight", "value": "300" },
      { "type": "colors", "value": "[\"#0b0f1a\",\"#ff6b00\",\"#101215\"]" },
      { "type": "starterHtml", "value": "<div class=planet></div>" },
      { "type": "starterCss", "value": ".planet{width:80px;height:80px;background:#ff6b00;border-radius:50%;}" },
      { "type": "targetHtml", "value": "<div class=planet><span></span></div>" },
      { "type": "targetCss", "value": ".planet{width:140px;height:140px;background:#ff6b00;border-radius:50%;display:grid;place-items:center}.planet span{width:40px;height:40px;background:#101215;border-radius:50%}" }
    ],
    "expectedOutput": "100"
  }
]`
  }

  return `[
  {
    "inputs": [
      { "type": "a", "value": "2" },
      { "type": "b", "value": "3" }
    ],
    "expectedOutput": "5"
  }
]`
}

function getTestCasesHelpText(type: Challenge['type']) {
  if (type === 'thats_not_my_coder') {
    return (
      <>
        Enter a JSON array of review cases. Use an input with type{' '}
        <code>code</code> for the snippet, optional inputs like{' '}
        <code>title</code>, <code>author</code>, <code>language</code>,{' '}
        <code>note</code>, <code>rationale</code>, <code>timeLimit</code>, and
        set <code>expectedOutput</code> to <code>accept</code> or{' '}
        <code>deny</code>.
      </>
    )
  }

  if (type === 'css_battle') {
    return (
      <>
        Enter a JSON array of visual battle cases. Use an input with type{' '}
        <code>targetHtml</code> and <code>targetCss</code> for the target,{' '}
        optional inputs like <code>starterHtml</code>, <code>starterCss</code>,{' '}
        <code>viewportWidth</code>, <code>viewportHeight</code>,{' '}
        <code>colors</code> (JSON array string), and <code>note</code>, and set{' '}
        <code>expectedOutput</code> to the minimum score (0-100) as a string.
      </>
    )
  }

  return (
    <>
      Enter a JSON array. Each input value and expected output should be a
      string, for example <code>"2"</code> or <code>"[1,2,3]"</code>.
    </>
  )
}

function mapDraftToFormValues(
  draft: GeneratedChallengeDraft,
): ChallengeFormValues {
  const starterCodes: Record<EditorLanguage, string> = {
    javascript: draft.starterCodes.javascript ?? draft.starterCode ?? '',
    typescript: draft.starterCodes.typescript ?? '',
    python: draft.starterCodes.python ?? '',
    java: draft.starterCodes.java ?? '',
    cpp: draft.starterCodes.cpp ?? '',
  }

  return {
    title: draft.title,
    content: draft.content,
    starterCode: starterCodes.javascript,
    starterCodes,
    difficulty: draft.difficulty,
    type: draft.type,
    topics: draft.topics,
    acceptanceRate: String(draft.acceptanceRate),
    examples: draft.examples.join('\n'),
    constraints: draft.constraints.join('\n'),
    conditions: draft.conditions.join('\n'),
    testCases:
      draft.cases.length > 0 ? JSON.stringify(draft.cases, null, 2) : '[]',
    quizQuestions:
      draft.quizQuestions.length > 0
        ? JSON.stringify(draft.quizQuestions, null, 2)
        : '[]',
  }
}

function ChallengeFormDialog({
  challenge,
  open,
  onOpenChange,
  onSubmit,
  onGenerateDraft,
  isPending,
  isGeneratingDraft = false,
  trigger,
  errorMessage,
}: {
  challenge?: Challenge
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ChallengeFormValues) => Promise<void> | void
  onGenerateDraft?: (
    values: ChallengeFormValues,
  ) => Promise<ChallengeFormValues> | ChallengeFormValues
  isPending: boolean
  isGeneratingDraft?: boolean
  trigger?: React.ReactNode
  errorMessage?: string | null
}) {
  const [values, setValues] = useState<ChallengeFormValues>(() =>
    getDefaultFormValues(challenge),
  )
  const [activeStarterLanguage, setActiveStarterLanguage] =
    useState<EditorLanguage>('javascript')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [cssBattleCases, setCssBattleCases] = useState<CssBattleCaseForm[]>(
    () => mapCasesToCssBattleForms(safeParseChallengeCases(values.testCases)),
  )
  const [thatsNotMyCoderCases, setThatsNotMyCoderCases] = useState<
    ThatsNotMyCoderCaseForm[]
  >(() =>
    mapCasesToThatsNotMyCoderForms(safeParseChallengeCases(values.testCases)),
  )

  const dialogTitle = challenge ? 'Edit challenge' : 'Create challenge'
  const dialogDescription = challenge
    ? 'Update the challenge details and save the changes.'
    : 'Create a new challenge that will appear in the admin list.'
  const hasTopics = values.topics.length > 0
  const isQuizType = values.type === 'quiz' || values.type === 'quiz_pvp'
  const isThatsNotMyCoderType = values.type === 'thats_not_my_coder'
  const isCssBattleType = values.type === 'css_battle'
  const isCustomVisualType = isThatsNotMyCoderType || isCssBattleType
  const requiresTopics = !isCssBattleType && !isThatsNotMyCoderType

  const updateCssBattleCases = (nextCases: CssBattleCaseForm[]) => {
    const normalized =
      nextCases.length > 0 ? [nextCases[0]] : [DEFAULT_CSS_BATTLE_CASE]
    setCssBattleCases(normalized)
    const mappedCases = mapCssBattleFormsToCases(normalized)
    setValues((current) => ({
      ...current,
      testCases: JSON.stringify(mappedCases, null, 2),
    }))
  }

  const updateCssBattleCase = (
    updater: (current: CssBattleCaseForm) => CssBattleCaseForm,
  ) => {
    const currentCase = cssBattleCases[0] ?? DEFAULT_CSS_BATTLE_CASE
    updateCssBattleCases([updater(currentCase)])
  }

  const updateThatsNotMyCoderCases = (nextCases: ThatsNotMyCoderCaseForm[]) => {
    const normalized = nextCases.length > 0 ? nextCases : [DEFAULT_TNMC_CASE]
    setThatsNotMyCoderCases(normalized)
    const mappedCases = mapThatsNotMyCoderFormsToCases(normalized)
    setValues((current) => ({
      ...current,
      testCases: JSON.stringify(mappedCases, null, 2),
    }))
  }

  const updateThatsNotMyCoderCase = (
    index: number,
    updater: (current: ThatsNotMyCoderCaseForm) => ThatsNotMyCoderCaseForm,
  ) => {
    updateThatsNotMyCoderCases(
      thatsNotMyCoderCases.map((current, currentIndex) =>
        currentIndex === index ? updater(current) : current,
      ),
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          const defaults = getDefaultFormValues(challenge)
          setValues(defaults)
          setActiveStarterLanguage('javascript')
          setGenerationError(null)
          setCssBattleCases(
            mapCasesToCssBattleForms(
              safeParseChallengeCases(defaults.testCases),
            ),
          )
          setThatsNotMyCoderCases(
            mapCasesToThatsNotMyCoderForms(
              safeParseChallengeCases(defaults.testCases),
            ),
          )
        }
        onOpenChange(nextOpen)
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form
          className="grid max-h-[calc(90vh-7rem)] gap-4 overflow-y-auto pr-1"
          onSubmit={async (event) => {
            event.preventDefault()
            if (requiresTopics && !hasTopics) return
            await onSubmit(values)
          }}
        >
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {generationError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Generation failed</AlertTitle>
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="challenge-title">Title</Label>
              {onGenerateDraft ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!values.title.trim() || isGeneratingDraft}
                  onClick={async () => {
                    setGenerationError(null)

                    try {
                      const generatedValues = await onGenerateDraft(values)
                      setValues(generatedValues)
                      setActiveStarterLanguage('javascript')
                      const generatedCases = safeParseChallengeCases(
                        generatedValues.testCases,
                      )
                      setCssBattleCases(
                        mapCasesToCssBattleForms(generatedCases),
                      )
                      setThatsNotMyCoderCases(
                        mapCasesToThatsNotMyCoderForms(generatedCases),
                      )
                    } catch (error) {
                      setGenerationError(getErrorMessage(error))
                    }
                  }}
                >
                  {isGeneratingDraft ? 'Generating...' : 'Generate with AI'}
                </Button>
              ) : null}
            </div>
            <Input
              id="challenge-title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Two Sum"
              required
            />
            {onGenerateDraft ? (
              <p className="text-xs text-muted-foreground">
                Uses the current title and selected challenge type to draft the
                form with Google AI Studio.
              </p>
            ) : null}
          </div>

          {!isCssBattleType ? (
            <div className="grid gap-2">
              <Label htmlFor="challenge-content">Content</Label>
              <textarea
                id="challenge-content"
                value={values.content}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                className="min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder="Describe the problem statement."
                required
              />
            </div>
          ) : null}

          {!isQuizType && !isCustomVisualType ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="challenge-starter-code">Starter Code</Label>
                <div className="grid gap-1 justify-items-end">
                  <Label
                    htmlFor="challenge-starter-language"
                    className="text-xs"
                  >
                    Starter Code Language
                  </Label>
                  <Select
                    value={activeStarterLanguage}
                    onValueChange={(value) =>
                      setActiveStarterLanguage(value as EditorLanguage)
                    }
                  >
                    <SelectTrigger
                      id="challenge-starter-language"
                      className="w-44"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDITOR_LANGUAGES.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <textarea
                id="challenge-starter-code"
                value={values.starterCodes[activeStarterLanguage]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    starterCode:
                      activeStarterLanguage === 'javascript'
                        ? event.target.value
                        : current.starterCode,
                    starterCodes: {
                      ...current.starterCodes,
                      [activeStarterLanguage]: event.target.value,
                    },
                  }))
                }
                className="min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-mono"
                placeholder="Starter code for the selected language"
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="challenge-difficulty">Difficulty</Label>
              <Select
                value={values.difficulty}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    difficulty: value as Challenge['difficulty'],
                  }))
                }
              >
                <SelectTrigger id="challenge-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="challenge-type">Type</Label>
              <Select
                value={values.type}
                onValueChange={(value) => {
                  const nextType = value as Challenge['type']
                  setValues((current) => ({
                    ...current,
                    type: nextType,
                  }))

                  const parsedCases = safeParseChallengeCases(values.testCases)

                  if (nextType === 'css_battle') {
                    setCssBattleCases(mapCasesToCssBattleForms(parsedCases))
                  }

                  if (nextType === 'thats_not_my_coder') {
                    setThatsNotMyCoderCases(
                      mapCasesToThatsNotMyCoderForms(parsedCases),
                    )
                  }
                }}
              >
                <SelectTrigger id="challenge-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="pvp">1v1</SelectItem>
                  <SelectItem value="quiz_pvp">Quiz 1v1</SelectItem>
                  <SelectItem value="teams">Teams</SelectItem>
                  <SelectItem value="imposter">Coders vs Imposter</SelectItem>
                  <SelectItem value="thats_not_my_coder">
                    That&apos;s Not My Coder
                  </SelectItem>
                  <SelectItem value="css_battle">CSS Battle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="challenge-acceptance">Acceptance Rate</Label>
              <Input
                id="challenge-acceptance"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={values.acceptanceRate}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    acceptanceRate: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          {!isCssBattleType && !isThatsNotMyCoderType ? (
            <div className="grid gap-2">
              <Label htmlFor="challenge-topics">Topics</Label>
              <div
                id="challenge-topics"
                className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-input p-3 sm:grid-cols-3"
              >
                {CHALLENGE_TOPICS.map((topic) => {
                  const isSelected = values.topics.includes(topic)

                  return (
                    <Button
                      key={topic}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          topics: isSelected
                            ? current.topics.filter((item) => item !== topic)
                            : [...current.topics, topic],
                        }))
                      }
                    >
                      {topic}
                    </Button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {values.topics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more topics.
              </p>
              {!hasTopics ? (
                <p className="text-xs text-destructive">
                  Select at least one topic.
                </p>
              ) : null}
            </div>
          ) : null}

          {isQuizType ? (
            <div className="grid gap-2">
              <Label htmlFor="challenge-quiz-questions">Quiz Questions</Label>
              <textarea
                id="challenge-quiz-questions"
                value={values.quizQuestions}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    quizQuestions: event.target.value,
                  }))
                }
                className="min-h-56 rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder={`[
  {
    "id": "q1",
    "prompt": "Which of these are sorting algorithms?",
    "options": [
      { "id": "merge", "text": "Merge Sort" },
      { "id": "stack", "text": "Stack" },
      { "id": "heap", "text": "Heap Sort" }
    ],
    "correctOptionIds": ["merge", "heap"],
    "explanation": "Merge Sort and Heap Sort are sorting algorithms."
  }
]`}
              />
              <p className="text-xs text-muted-foreground">
                Enter a JSON array with question ids, prompts, options, and one
                or more <code>correctOptionIds</code>.
              </p>
            </div>
          ) : isCssBattleType ? (
            <div className="grid gap-4">
              <Label>Battle Setup</Label>

              {(() => {
                const battleCase = cssBattleCases[0] ?? DEFAULT_CSS_BATTLE_CASE

                return (
                  <div className="rounded-md border border-border/60 bg-background/70 p-4 space-y-4">
                    <div className="grid gap-2">
                      <Label>Note</Label>
                      <Input
                        value={battleCase.note}
                        onChange={(event) =>
                          updateCssBattleCase((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        placeholder="Describe the target briefly"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label>Viewport Width</Label>
                        <Input
                          value={battleCase.viewportWidth}
                          onChange={(event) =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              viewportWidth: event.target.value,
                            }))
                          }
                          placeholder="400"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Viewport Height</Label>
                        <Input
                          value={battleCase.viewportHeight}
                          onChange={(event) =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              viewportHeight: event.target.value,
                            }))
                          }
                          placeholder="300"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label>Colors Palette</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              colors: [...current.colors, ''],
                            }))
                          }
                        >
                          Add Color
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {battleCase.colors.map((color, colorIndex) => (
                          <div
                            key={`css-color-${colorIndex}`}
                            className="flex items-center gap-2"
                          >
                            <Input
                              value={color}
                              onChange={(event) =>
                                updateCssBattleCase((current) => ({
                                  ...current,
                                  colors: current.colors.map(
                                    (entry, entryIndex) =>
                                      entryIndex === colorIndex
                                        ? event.target.value
                                        : entry,
                                  ),
                                }))
                              }
                              placeholder="#ff6b00"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={battleCase.colors.length === 1}
                              onClick={() =>
                                updateCssBattleCase((current) => ({
                                  ...current,
                                  colors: current.colors.filter(
                                    (_, entryIndex) =>
                                      entryIndex !== colorIndex,
                                  ),
                                }))
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These colors are saved in the case and can be shown to
                        players as the target palette.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Starter HTML</Label>
                        <textarea
                          value={battleCase.starterHtml}
                          onChange={(event) =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              starterHtml: event.target.value,
                            }))
                          }
                          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          placeholder="<div class=planet></div>"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Starter CSS</Label>
                        <textarea
                          value={battleCase.starterCss}
                          onChange={(event) =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              starterCss: event.target.value,
                            }))
                          }
                          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          placeholder=".planet{width:80px;height:80px;background:#ff6b00;border-radius:50%;}"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Target HTML</Label>
                        <textarea
                          value={battleCase.targetHtml}
                          onChange={(event) =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              targetHtml: event.target.value,
                            }))
                          }
                          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          placeholder="<div class=planet><span></span></div>"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Target CSS</Label>
                        <textarea
                          value={battleCase.targetCss}
                          onChange={(event) =>
                            updateCssBattleCase((current) => ({
                              ...current,
                              targetCss: event.target.value,
                            }))
                          }
                          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          placeholder=".planet{width:140px;height:140px;background:#ff6b00;border-radius:50%;}"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:max-w-xs">
                      <Label>Minimum Score (0-100)</Label>
                      <Input
                        value={battleCase.expectedOutput}
                        onChange={(event) =>
                          updateCssBattleCase((current) => ({
                            ...current,
                            expectedOutput: event.target.value,
                          }))
                        }
                        placeholder="100"
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : isThatsNotMyCoderType ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <Label>Review Cases</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateThatsNotMyCoderCases([
                      ...thatsNotMyCoderCases,
                      DEFAULT_TNMC_CASE,
                    ])
                  }
                >
                  Add Case
                </Button>
              </div>

              <div className="space-y-4">
                {thatsNotMyCoderCases.map((reviewCase, caseIndex) => (
                  <div
                    key={`tnmc-case-${caseIndex}`}
                    className="rounded-md border border-border/60 bg-background/70 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold">
                        Case {caseIndex + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={thatsNotMyCoderCases.length === 1}
                        onClick={() =>
                          updateThatsNotMyCoderCases(
                            thatsNotMyCoderCases.filter(
                              (_, index) => index !== caseIndex,
                            ),
                          )
                        }
                      >
                        Remove Case
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                          value={reviewCase.title}
                          onChange={(event) =>
                            updateThatsNotMyCoderCase(caseIndex, (current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder="Rate limiter patch"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Author</Label>
                        <Input
                          value={reviewCase.author}
                          onChange={(event) =>
                            updateThatsNotMyCoderCase(caseIndex, (current) => ({
                              ...current,
                              author: event.target.value,
                            }))
                          }
                          placeholder="suspicious_commit_bot"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Language</Label>
                        <Input
                          value={reviewCase.language}
                          onChange={(event) =>
                            updateThatsNotMyCoderCase(caseIndex, (current) => ({
                              ...current,
                              language: event.target.value,
                            }))
                          }
                          placeholder="typescript"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Note</Label>
                        <Input
                          value={reviewCase.note}
                          onChange={(event) =>
                            updateThatsNotMyCoderCase(caseIndex, (current) => ({
                              ...current,
                              note: event.target.value,
                            }))
                          }
                          placeholder="Patch review summary"
                        />
                      </div>
                      <div className="grid gap-2 sm:max-w-xs">
                        <Label>Time Limit (seconds)</Label>
                        <Input
                          value={reviewCase.timeLimit}
                          onChange={(event) =>
                            updateThatsNotMyCoderCase(caseIndex, (current) => ({
                              ...current,
                              timeLimit: event.target.value,
                            }))
                          }
                          placeholder="15"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Rationale</Label>
                      <textarea
                        value={reviewCase.rationale}
                        onChange={(event) =>
                          updateThatsNotMyCoderCase(caseIndex, (current) => ({
                            ...current,
                            rationale: event.target.value,
                          }))
                        }
                        className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        placeholder="Why this case should be accepted or denied"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Code</Label>
                      <textarea
                        value={reviewCase.code}
                        onChange={(event) =>
                          updateThatsNotMyCoderCase(caseIndex, (current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                        className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        placeholder="export function isAdmin(user) {\n  return true\n}"
                      />
                    </div>

                    <div className="grid gap-2 sm:max-w-xs">
                      <Label>Expected Decision</Label>
                      <Select
                        value={reviewCase.expectedOutput}
                        onValueChange={(value) =>
                          updateThatsNotMyCoderCase(caseIndex, (current) => ({
                            ...current,
                            expectedOutput:
                              value === 'accept' ? 'accept' : 'deny',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accept">accept</SelectItem>
                          <SelectItem value="deny">deny</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="challenge-test-cases">
                {getTestCasesLabel(values.type)}
              </Label>
              <textarea
                id="challenge-test-cases"
                value={values.testCases}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    testCases: event.target.value,
                  }))
                }
                className="min-h-56 rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder={getTestCasesPlaceholder(values.type)}
              />
              <p className="text-xs text-muted-foreground">
                {getTestCasesHelpText(values.type)}
              </p>
            </div>
          )}

          {!isCssBattleType && !isThatsNotMyCoderType ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="challenge-examples">Examples</Label>
                <textarea
                  id="challenge-examples"
                  value={values.examples}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      examples: event.target.value,
                    }))
                  }
                  className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="One example per line"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="challenge-constraints">Constraints</Label>
                <textarea
                  id="challenge-constraints"
                  value={values.constraints}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      constraints: event.target.value,
                    }))
                  }
                  className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="One constraint per line"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="challenge-conditions">Conditions</Label>
                <textarea
                  id="challenge-conditions"
                  value={values.conditions}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      conditions: event.target.value,
                    }))
                  }
                  className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="One condition per line"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? challenge
                  ? 'Saving...'
                  : 'Creating...'
                : challenge
                  ? 'Save changes'
                  : 'Create challenge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createFileRoute('/challenges')({
  component: RouteComponent,
})

function RouteComponent() {
  const [typeFilter, setTypeFilter] = useState('All')
  const [topicFilter, setTopicFilter] = useState('All Topics')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  )
  const [adminActionError, setAdminActionError] = useState<string | null>(null)
  const [joinPvpDialogOpen, setJoinPvpDialogOpen] = useState(false)
  const [joinPvpMatchId, setJoinPvpMatchId] = useState('')
  const [selectedPvpChallengeId, setSelectedPvpChallengeId] = useState<
    number | null
  >(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [challengePendingDeletion, setChallengePendingDeletion] =
    useState<Challenge | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()
  const isAuthenticated = useIsAuthenticated()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const challengesQuery = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedChallenges>('/challenges', {
        params: {
          limit: FETCH_LIMIT,
        },
      })
      return data
    },
  })
  const recommendationsQuery = useQuery({
    queryKey: ['recommendations', 'me'],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<RecommendationResponse>(
        '/recommendations/me',
        {
          params: {
            limit: 5,
          },
        },
      )
      return data
    },
  })

  const createChallengeMutation = useMutation({
    mutationFn: async (values: ChallengeFormValues) => {
      const payload = buildChallengePayload(values)
      const { data } = await api.post<Challenge>('/challenges/add', payload)
      return data
    },
    onSuccess: async (createdChallenge) => {
      setAdminActionError(null)
      updateCachedChallenges(queryClient, (current) => [
        createdChallenge,
        ...current,
      ])
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
    onError: (error) => {
      setAdminActionError(getErrorMessage(error))
    },
  })

  const generateChallengeDraftMutation = useMutation({
    mutationFn: async (values: ChallengeFormValues) => {
      const { data } = await api.post<GeneratedChallengeDraft>(
        '/challenges/generate-draft',
        {
          title: values.title.trim(),
          type: values.type,
        },
      )

      return mapDraftToFormValues(data)
    },
  })

  const updateChallengeMutation = useMutation({
    mutationFn: async (values: ChallengeFormValues & { id: number }) => {
      const payload = buildChallengePayload(values)
      const { data } = await api.patch<Challenge>(
        `/challenges/${values.id}/edit`,
        payload,
      )
      return data
    },
    onSuccess: async (updatedChallenge) => {
      setAdminActionError(null)
      updateCachedChallenges(queryClient, (current) =>
        current.map((challenge) =>
          challenge.id === updatedChallenge.id ? updatedChallenge : challenge,
        ),
      )
      setEditingChallenge(null)
      await queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
    onError: (error) => {
      setAdminActionError(getErrorMessage(error))
    },
  })

  const deleteChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      await api.delete(`/challenges/${challengeId}`)
      return challengeId
    },
    onSuccess: async (deletedChallengeId) => {
      setAdminActionError(null)
      updateCachedChallenges(queryClient, (current) =>
        current.filter((challenge) => challenge.id !== deletedChallengeId),
      )
      await queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
    onError: (error) => {
      setAdminActionError(getErrorMessage(error))
    },
  })

  const joinPvpMatchMutation = useMutation({
    mutationFn: async (value: string) => {
      const { data } = await api.post<Match>(`/matches/${value}/join`)
      return data
    },
    onSuccess: (data) => {
      setJoinPvpDialogOpen(false)
      setJoinPvpMatchId('')
      setSelectedPvpChallengeId(null)
      navigate({
        to: '/challenge',
        search: { id: data.challenge.id, matchId: data.id },
      })
    },
  })

  const challenges = challengesQuery.data?.data ?? []
  const recommendedChallenges = recommendationsQuery.data?.data ?? []
  const pvpChallenges = useMemo(
    () =>
      challenges.filter(
        (challenge) =>
          challenge.type === 'pvp' || challenge.type === 'quiz_pvp',
      ),
    [challenges],
  )

  const topics = useMemo(
    () => [
      'All Topics',
      ...new Set(challenges.flatMap((challenge) => challenge.topics)),
    ],
    [challenges],
  )

  const filteredData = useMemo(
    () =>
      challenges.filter((challenge) => {
        const matchesType =
          typeFilter === 'All' || formatType(challenge.type) === typeFilter
        const matchesTopic =
          topicFilter === 'All Topics' || challenge.topics.includes(topicFilter)
        const normalizedSearch = search.trim().toLowerCase()
        const matchesSearch =
          normalizedSearch.length === 0 ||
          challenge.title.toLowerCase().includes(normalizedSearch)

        return matchesType && matchesTopic && matchesSearch
      }),
    [challenges, search, topicFilter, typeFilter],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  )
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
      const isShortcutsShortcut =
        event.key === 'F1' ||
        (!event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          event.key === '?' &&
          !isTextEntryTarget(event.target))
      const isSearchShortcut =
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') ||
        (!event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          event.key === '/' &&
          !isTextEntryTarget(event.target))

      if (isShortcutsShortcut) {
        event.preventDefault()
        setShortcutsOpen(true)
        return
      }

      if (isSearchShortcut) {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  const featuredChallenge = filteredData[0] ?? challenges[0] ?? null
  const recommendedChallengeCards = useMemo(
    () =>
      recommendedChallenges.filter(
        (recommendation) =>
          recommendation.challenge &&
          challenges.some(
            (challenge) => challenge.id === recommendation.challenge.id,
          ),
      ),
    [challenges, recommendedChallenges],
  )

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {featuredChallenge && (
          <div
            className="group relative overflow-hidden border border-primary/20 hover:cursor-pointer select-none hover:shadow-2xl shadow-primary/5 transition-all"
            onClick={() =>
              navigate({
                to: '/challenge',
                search: { id: featuredChallenge.id },
              })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate({
                  to: '/challenge',
                  search: { id: featuredChallenge.id },
                })
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-background p-4 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-6 items-center">
                <div className="h-20 w-20 bg-primary/10 flex items-center justify-center border border-primary/20 relative p-2">
                  <Flame className="text-primary w-full h-full animate-pulse opacity-15" />
                  <h2 className="text-4xl absolute opacity-55">
                    {featuredChallenge.id}
                  </h2>
                </div>
                <div className="group-hover:text-primary">
                  <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 uppercase tracking-widest text-[10px]">
                    Featured Challenge
                  </Badge>
                  <h2 className="text-3xl uppercase">
                    #{featuredChallenge.id.toString().padStart(3, '0')}:{' '}
                    {featuredChallenge.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {formatDifficulty(featuredChallenge.difficulty)} •{' '}
                    {featuredChallenge.topics[0] ?? 'General'} •
                    <span className="text-primary">
                      {' '}
                      Acceptance:{' '}
                      {Number(featuredChallenge.acceptanceRate).toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <Card className="border-primary/20 bg-linear-to-br from-primary/8 via-background to-background">
            <CardHeader className="gap-3 border-b border-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <Star className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.3em]">
                  Recommended For You
                </span>
              </div>
              <CardTitle className="flex items-center gap-2 text-2xl uppercase">
                Next best challenges
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>
                Personalized picks based on your ByteBattle submission history.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recommendationsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Building recommendations...
                </div>
              ) : recommendationsQuery.isError ? (
                <div className="text-sm text-muted-foreground">
                  Recommendations are unavailable right now.
                </div>
              ) : recommendedChallengeCards.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Solve a few solo or quiz challenges to unlock personalized
                  recommendations.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recommendedChallengeCards.map((recommendation) => {
                    const score = Math.round(recommendation.score * 100)

                    return (
                      <div
                        key={`${recommendation.challengeId}-${recommendation.rank}`}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          navigate({
                            to: '/challenge',
                            search: { id: recommendation.challenge.id },
                          })
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            navigate({
                              to: '/challenge',
                              search: { id: recommendation.challenge.id },
                            })
                          }
                        }}
                        className="group cursor-pointer border border-border bg-background/70 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px]">
                              Rank #{recommendation.rank}
                            </Badge>
                            <h3 className="text-lg font-bold uppercase group-hover:text-primary">
                              {recommendation.challenge.title}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {score}%
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              solve score
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="uppercase">
                            {formatDifficulty(
                              recommendation.challenge.difficulty,
                            )}
                          </Badge>
                          <Badge variant="secondary" className="uppercase">
                            {formatType(recommendation.challenge.type)}
                          </Badge>
                          <Badge variant="secondary" className="uppercase">
                            {recommendation.challenge.topics[0] ?? 'General'}
                          </Badge>
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground">
                          {recommendation.reason}
                        </p>

                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Acceptance{' '}
                            {Number(
                              recommendation.challenge.acceptanceRate,
                            ).toFixed(1)}
                            %
                          </span>
                          <span>Model-driven suggestion</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {isAdmin ? (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShortcutsOpen(true)}
            >
              Shortcuts
            </Button>
            <ChallengeFormDialog
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (!open) {
                  setAdminActionError(null)
                }
              }}
              onSubmit={async (values) => {
                await createChallengeMutation.mutateAsync(values)
              }}
              onGenerateDraft={async (values) => {
                setAdminActionError(null)
                return generateChallengeDraftMutation.mutateAsync(values)
              }}
              isPending={createChallengeMutation.isPending}
              isGeneratingDraft={generateChallengeDraftMutation.isPending}
              errorMessage={adminActionError}
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create challenge
                </Button>
              }
            />
          </div>
        ) : null}

        {pvpChallenges.length > 0 ? (
          <div className="space-y-4 border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold uppercase tracking-widest text-foreground">
                  <Swords className="h-4 w-4 text-primary" />
                  1v1 Quick Access
                </h2>
                <p className="text-sm text-muted-foreground">
                  Open a duel challenge or join an existing match by ID.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!isAuthenticated}
                onClick={() => {
                  setJoinPvpDialogOpen(true)
                  setSelectedPvpChallengeId(null)
                }}
              >
                Join Match By ID
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pvpChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="space-y-3 rounded-lg border border-border bg-background p-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-primary">
                      1v1 Challenge
                    </p>
                    <h3 className="font-bold text-foreground">
                      #{challenge.id.toString().padStart(3, '0')}{' '}
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDifficulty(challenge.difficulty)} •{' '}
                      {challenge.topics[0] ?? 'General'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: '/challenge',
                          search: { id: challenge.id },
                        })
                      }
                    >
                      Open 1v1
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!isAuthenticated}
                      onClick={() => {
                        setSelectedPvpChallengeId(challenge.id)
                        setJoinPvpDialogOpen(true)
                      }}
                    >
                      Join By ID
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-card/30 p-4 border border-border">
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <Tabs
              defaultValue="All"
              onValueChange={(value) => {
                setTypeFilter(value)
                setCurrentPage(1)
              }}
            >
              <TabsList className="bg-background border border-border">
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Solo">Solo</TabsTrigger>
                <TabsTrigger value="Quiz">Quiz</TabsTrigger>
                <TabsTrigger value="1v1">1v1</TabsTrigger>
                <TabsTrigger value="Quiz 1v1">Quiz 1v1</TabsTrigger>
                <TabsTrigger value="Teams">Teams</TabsTrigger>
                <TabsTrigger value="CSS Battle">CSS Battle</TabsTrigger>
                <TabsTrigger value="That's Not My Coder">
                  That&apos;s Not My Coder
                </TabsTrigger>
                <TabsTrigger value="Coders vs Imposter">
                  Coders vs Imposter
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              onValueChange={(value) => {
                setTopicFilter(value)
                setCurrentPage(1)
              }}
              defaultValue="All Topics"
            >
              <Label htmlFor="challenge-topic-filter" className="sr-only">
                Filter challenges by topic
              </Label>
              <SelectTrigger
                id="challenge-topic-filter"
                className="w-45 bg-background border-border"
              >
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full items-center gap-2 xl:w-auto">
            <div className="relative w-full xl:w-96">
              <Label htmlFor="challenge-search" className="sr-only">
                Search challenges
              </Label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                id="challenge-search"
                placeholder="Filter problems..."
                className="pl-10 bg-background border-border"
                aria-keyshortcuts="/ Control+K Meta+K"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            {!isAdmin ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShortcutsOpen(true)}
              >
                Shortcuts
              </Button>
            ) : null}
          </div>
        </div>

        {challengesQuery.isLoading ? (
          <div className="border border-border bg-card p-8 text-sm text-muted-foreground">
            Loading challenges...
          </div>
        ) : challengesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Challenges unavailable</AlertTitle>
            <AlertDescription>
              {getErrorMessage(challengesQuery.error)}
            </AlertDescription>
          </Alert>
        ) : filteredData.length === 0 ? (
          <div className="border border-border bg-card p-8 text-sm text-muted-foreground">
            No challenges match the current filters.
          </div>
        ) : (
          <>
            {adminActionError && isAdmin ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Admin action failed</AlertTitle>
                <AlertDescription>{adminActionError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-20 font-quantico text-xs uppercase text-muted-foreground px-6">
                      ID
                    </TableHead>
                    <TableHead className="text-xs uppercase text-foreground">
                      Title
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Difficulty
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase text-muted-foreground px-6">
                      Acceptance
                    </TableHead>
                    {isAdmin ? (
                      <TableHead className="text-right text-xs uppercase text-muted-foreground px-6">
                        Actions
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((challenge) => (
                    <TableRow
                      key={challenge.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate({
                          to: '/challenge',
                          search: { id: challenge.id },
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate({
                            to: '/challenge',
                            search: { id: challenge.id },
                          })
                        }
                      }}
                      className="border-border hover:bg-primary/5 transition-colors group cursor-pointer h-16"
                    >
                      <TableCell className="font-mono text-muted-foreground px-6">
                        #{challenge.id.toString().padStart(3, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 font-bold group-hover:text-primary transition-colors">
                          {challenge.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-bold uppercase tracking-widest ${
                            challenge.difficulty === 'easy'
                              ? 'text-emerald-500'
                              : challenge.difficulty === 'medium'
                                ? 'text-amber-500'
                                : 'text-rarity-epic'
                          }`}
                        >
                          {formatDifficulty(challenge.difficulty)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] bg-muted/50 text-muted-foreground uppercase"
                        >
                          {challenge.topics[0] ?? 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground px-6">
                        <Progress value={Number(challenge.acceptanceRate)} />
                      </TableCell>
                      {isAdmin ? (
                        <TableCell className="px-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={(event) => {
                                event.stopPropagation()
                                setAdminActionError(null)
                                setEditingChallenge(challenge)
                              }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-2">
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Update this challenge
                                </TooltipContent>
                              </Tooltip>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              disabled={deleteChallengeMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation()
                                setChallengePendingDeletion(challenge)
                              }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Delete this challenge
                                </TooltipContent>
                              </Tooltip>
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <p className="text-xs text-muted-foreground font-mono">
                Showing {paginatedData.length} of {filteredData.length}{' '}
                challenges
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                      className="px-3 py-2 hover:text-primary disabled:opacity-30 flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                  </PaginationItem>

                  <div className="flex gap-1 px-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <PaginationItem key={index}>
                        <Button
                          variant="secondary"
                          onClick={() => setCurrentPage(index + 1)}
                          className={`w-8 h-8 text-xs font-bold transition-all ${
                            currentPage === index + 1
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {index + 1}
                        </Button>
                      </PaginationItem>
                    ))}
                  </div>

                  <PaginationItem>
                    <Button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((page) => page + 1)}
                      className="px-3 py-2 hover:text-primary disabled:opacity-30 flex items-center gap-1 transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}

        {editingChallenge ? (
          <ChallengeFormDialog
            challenge={editingChallenge}
            open={!!editingChallenge}
            onOpenChange={(open) => {
              if (!open) {
                setEditingChallenge(null)
                setAdminActionError(null)
              }
            }}
            onSubmit={async (values) => {
              await updateChallengeMutation.mutateAsync({
                ...values,
                id: editingChallenge.id,
              })
            }}
            onGenerateDraft={async (values) => {
              setAdminActionError(null)
              return generateChallengeDraftMutation.mutateAsync(values)
            }}
            isPending={updateChallengeMutation.isPending}
            isGeneratingDraft={generateChallengeDraftMutation.isPending}
            errorMessage={adminActionError}
          />
        ) : null}

        <Dialog open={joinPvpDialogOpen} onOpenChange={setJoinPvpDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join 1v1 Match</DialogTitle>
              <DialogDescription>
                Paste a match ID to join an active duel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="join-pvp-match-id">Match ID</Label>
              <Input
                id="join-pvp-match-id"
                value={joinPvpMatchId}
                onChange={(event) => setJoinPvpMatchId(event.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              {selectedPvpChallengeId ? (
                <p className="text-xs text-muted-foreground">
                  Selected from challenge #{selectedPvpChallengeId}.
                </p>
              ) : null}
            </div>
            {joinPvpMatchMutation.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Join failed</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(joinPvpMatchMutation.error)}
                </AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setJoinPvpDialogOpen(false)
                  setJoinPvpMatchId('')
                  setSelectedPvpChallengeId(null)
                }}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !joinPvpMatchId.trim() || joinPvpMatchMutation.isPending
                }
                className="rounded-none"
                onClick={() =>
                  joinPvpMatchMutation.mutate(joinPvpMatchId.trim())
                }
              >
                {joinPvpMatchMutation.isPending ? 'Joining...' : 'Join Match'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <KeyboardShortcutsDialog
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
          description="The challenge list is keyboard accessible."
          items={[
            {
              action: 'Focus challenge search',
              shortcuts: ['/', 'Ctrl+K', 'Cmd+K'],
            },
            {
              action: 'Open shortcuts help',
              shortcuts: ['?', 'F1'],
            },
            {
              action: 'Open a focused challenge card or row',
              shortcuts: ['Enter', 'Space'],
            },
          ]}
          footerNote="Use Tab and Shift+Tab to move through filters, pagination, and challenge actions without a mouse."
        />
        <ConfirmDialog
          open={!!challengePendingDeletion}
          onOpenChange={(open) => {
            if (!open) {
              setChallengePendingDeletion(null)
            }
          }}
          title="Delete Challenge"
          description={
            challengePendingDeletion
              ? `Delete challenge "${challengePendingDeletion.title}"?`
              : 'Delete this challenge?'
          }
          confirmLabel="Delete Challenge"
          confirmVariant="destructive"
          isPending={deleteChallengeMutation.isPending}
          onConfirm={async () => {
            if (!challengePendingDeletion) {
              return
            }

            setAdminActionError(null)
            await deleteChallengeMutation.mutateAsync(
              challengePendingDeletion.id,
            )
            setChallengePendingDeletion(null)
          }}
        />
      </div>
    </div>
  )
}

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
  PaginationEllipsis,
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
const FETCH_LIMIT = 5000
const PAGINATION_WINDOW = 2
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
    case 'solo':
      return 'Solo'
    case 'teams':
      return 'Teams'
    default:
      return type
  }
}

function buildVisiblePageItems(
  currentPage: number,
  totalPages: number,
  windowSize: number,
) {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)

  for (
    let page = Math.max(1, currentPage - windowSize);
    page <= Math.min(totalPages, currentPage + windowSize);
    page++
  ) {
    pages.add(page)
  }

  const sortedPages = Array.from(pages).sort((left, right) => left - right)
  const visibleItems: Array<number | 'ellipsis'> = []

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1]

    if (index > 0 && previousPage && page - previousPage > 1) {
      visibleItems.push('ellipsis')
    }

    visibleItems.push(page)
  })

  return visibleItems
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

  return {
    title: values.title.trim(),
    content: values.content.trim(),
    starterCode: isQuizType ? '' : values.starterCodes.javascript,
    starterCodes: isQuizType
      ? {
          javascript: '',
          typescript: '',
          python: '',
          java: '',
          cpp: '',
        }
      : values.starterCodes,
    difficulty: values.difficulty,
    type: values.type,
    topics: values.topics,
    acceptanceRate: Number.isFinite(parsedAcceptanceRate)
      ? parsedAcceptanceRate
      : 100,
    examples: splitMultiline(values.examples),
    constraints: splitMultiline(values.constraints),
    conditions: splitMultiline(values.conditions),
    cases: isQuizType ? [] : parseChallengeCases(values.testCases),
    quizQuestions: isQuizType ? parseQuizQuestions(values.quizQuestions) : [],
  }
}

function mapDraftToFormValues(draft: GeneratedChallengeDraft): ChallengeFormValues {
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

  const dialogTitle = challenge ? 'Edit challenge' : 'Create challenge'
  const dialogDescription = challenge
    ? 'Update the challenge details and save the changes.'
    : 'Create a new challenge that will appear in the admin list.'
  const hasTopics = values.topics.length > 0
  const isQuizType = values.type === 'quiz' || values.type === 'quiz_pvp'

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setValues(getDefaultFormValues(challenge))
          setActiveStarterLanguage('javascript')
          setGenerationError(null)
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
            if (!hasTopics) return
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

          {!isQuizType ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="challenge-starter-code">Starter Code</Label>
                <div className="grid gap-1 justify-items-end">
                  <Label htmlFor="challenge-starter-language" className="text-xs">
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
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    type: value as Challenge['type'],
                  }))
                }
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
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="challenge-test-cases">Test Cases</Label>
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
                placeholder={`[
  {
    "inputs": [
      { "type": "a", "value": "2" },
      { "type": "b", "value": "3" }
    ],
    "expectedOutput": "5"
  }
]`}
              />
              <p className="text-xs text-muted-foreground">
                Enter a JSON array. Each input value and expected output should
                be a string, for example <code>"2"</code> or <code>"[1,2,3]"</code>.
              </p>
            </div>
          )}

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
  const visiblePageItems = useMemo(
    () => buildVisiblePageItems(currentPage, totalPages, PAGINATION_WINDOW),
    [currentPage, totalPages],
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

                  <div className="flex gap-1 px-2 flex-wrap justify-center">
                    {visiblePageItems.map((item, index) => {
                      if (item === 'ellipsis') {
                        return (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }

                      return (
                        <PaginationItem key={item}>
                          <Button
                            variant="secondary"
                            onClick={() => setCurrentPage(item)}
                            className={`w-8 h-8 text-xs font-bold transition-all ${
                              currentPage === item
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {item}
                          </Button>
                        </PaginationItem>
                      )
                    })}
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

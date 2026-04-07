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
  Upload,
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
import type { Challenge } from '@/models/challenge'
import type { ChallengeCase } from '@/models/challenge'
import type { Match } from '@/models/match'
import type { PaginatedChallenges } from '@/models/paginated-challenge'

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
        : '[]',
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

function buildChallengePayload(values: ChallengeFormValues): ChallengePayload {
  const parsedAcceptanceRate = Number(values.acceptanceRate)

  return {
    title: values.title.trim(),
    content: values.content.trim(),
    starterCode: values.starterCodes.javascript,
    starterCodes: values.starterCodes,
    difficulty: values.difficulty,
    type: values.type,
    topics: values.topics,
    acceptanceRate: Number.isFinite(parsedAcceptanceRate)
      ? parsedAcceptanceRate
      : 100,
    examples: splitMultiline(values.examples),
    constraints: splitMultiline(values.constraints),
    conditions: splitMultiline(values.conditions),
    cases: parseChallengeCases(values.testCases),
  }
}

function ChallengeFormDialog({
  challenge,
  open,
  onOpenChange,
  onSubmit,
  isPending,
  trigger,
  errorMessage,
}: {
  challenge?: Challenge
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ChallengeFormValues) => Promise<void> | void
  isPending: boolean
  trigger?: React.ReactNode
  errorMessage?: string | null
}) {
  const [values, setValues] = useState<ChallengeFormValues>(() =>
    getDefaultFormValues(challenge),
  )
  const [activeStarterLanguage, setActiveStarterLanguage] =
    useState<EditorLanguage>('javascript')

  const dialogTitle = challenge ? 'Edit challenge' : 'Create challenge'
  const dialogDescription = challenge
    ? 'Update the challenge details and save the changes.'
    : 'Create a new challenge that will appear in the admin list.'
  const hasTopics = values.topics.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setValues(getDefaultFormValues(challenge))
          setActiveStarterLanguage('javascript')
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

          <div className="grid gap-2">
            <Label htmlFor="challenge-title">Title</Label>
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
                  <SelectItem value="pvp">1v1</SelectItem>
                  <SelectItem value="teams">Teams</SelectItem>
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
              Enter a JSON array. Each input value and expected output should be
              a string, for example <code>"2"</code> or <code>"[1,2,3]"</code>.
            </p>
          </div>

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

function BulkImportDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  trigger,
  errorMessage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (challenges: ChallengePayload[]) => Promise<void> | void
  isPending: boolean
  trigger?: React.ReactNode
  errorMessage?: string | null
}) {
  const [preview, setPreview] = useState<ChallengePayload[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      parseCSV(file)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())
      if (lines.length < 2) return

      // Simple CSV parser that handles quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        let i = 0

        while (i < line.length) {
          const char = line[i]
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"'
              i += 2
            } else {
              // Toggle quote state
              inQuotes = !inQuotes
              i++
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim())
            current = ''
            i++
          } else {
            current += char
            i++
          }
        }

        // Add the last field
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
      const challenges: ChallengePayload[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length !== headers.length) continue

        const challenge: any = {}
        headers.forEach((header, index) => {
          const value = values[index]
          switch (header) {
            case 'title':
              challenge.title = value
              break
            case 'content':
              challenge.content = value
              break
            case 'difficulty':
              challenge.difficulty = value.toLowerCase() as
                | 'easy'
                | 'medium'
                | 'hard'
              break
            case 'type':
              challenge.type = value.toLowerCase() as 'solo' | 'pvp' | 'teams'
              break
            case 'topics':
              challenge.topics = value.split(';').map((t: string) => t.trim())
              break
            case 'startercode':
              challenge.starterCode = value
              challenge.starterCodes = {
                javascript: value,
                typescript: '',
                python: '',
                java: '',
                cpp: '',
              }
              break
            case 'acceptancerate':
              challenge.acceptanceRate = parseFloat(value) || 100
              break
            case 'examples':
              challenge.examples = value.split(';').map((e: string) => e.trim())
              break
            case 'constraints':
              challenge.constraints = value
                .split(';')
                .map((c: string) => c.trim())
              break
            case 'conditions':
              challenge.conditions = value
                .split(';')
                .map((c: string) => c.trim())
              break
            case 'testcases':
              try {
                challenge.cases = JSON.parse(value)
              } catch {
                challenge.cases = []
              }
              break
          }
        })

        // Set defaults
        challenge.difficulty = challenge.difficulty || 'easy'
        challenge.type = challenge.type || 'solo'
        challenge.topics = challenge.topics || []
        challenge.acceptanceRate = challenge.acceptanceRate || 100
        challenge.examples = challenge.examples || []
        challenge.constraints = challenge.constraints || []
        challenge.conditions = challenge.conditions || []
        challenge.cases = challenge.cases || []
        challenge.starterCode = challenge.starterCode || ''
        challenge.starterCodes = challenge.starterCodes || {
          javascript: '',
          typescript: '',
          python: '',
          java: '',
          cpp: '',
        }

        if (challenge.title && challenge.content) {
          challenges.push(challenge as ChallengePayload)
        }
      }

      setPreview(challenges)
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (preview.length > 0) {
      await onSubmit(preview)
      setPreview([])
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPreview([])
        }
        onOpenChange(nextOpen)
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Challenges</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple challenges at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Expected columns: title, content, difficulty, type, topics,
              starterCode, acceptanceRate, examples, constraints, conditions,
              testCases
            </p>
          </div>

          {preview.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              <h4 className="font-semibold mb-2">
                Preview ({preview.length} challenges)
              </h4>
              <div className="space-y-2">
                {preview.slice(0, 5).map((challenge, index) => (
                  <div key={index} className="text-sm border-b pb-1">
                    <strong>{challenge.title}</strong> - {challenge.difficulty}{' '}
                    - {challenge.type}
                  </div>
                ))}
                {preview.length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    ... and {preview.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || preview.length === 0}
          >
            {isPending ? 'Importing...' : `Import ${preview.length} Challenges`}
          </Button>
        </DialogFooter>
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
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
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

  const bulkImportMutation = useMutation({
    mutationFn: async (challenges: ChallengePayload[]) => {
      const { data } = await api.post<Challenge[]>(
        '/challenges/bulk-import',
        challenges,
      )
      return data
    },
    onSuccess: async (importedChallenges) => {
      setAdminActionError(null)
      updateCachedChallenges(queryClient, (current) => [
        ...importedChallenges,
        ...current,
      ])
      setIsBulkImportOpen(false)
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
  const pvpChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.type === 'pvp'),
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
              isPending={createChallengeMutation.isPending}
              errorMessage={adminActionError}
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create challenge
                </Button>
              }
            />
            <BulkImportDialog
              open={isBulkImportOpen}
              onOpenChange={(open) => {
                setIsBulkImportOpen(open)
                if (!open) {
                  setAdminActionError(null)
                }
              }}
              onSubmit={async (challenges) => {
                await bulkImportMutation.mutateAsync(challenges)
              }}
              isPending={bulkImportMutation.isPending}
              errorMessage={adminActionError}
              trigger={
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Bulk Import
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
                <TabsTrigger value="1v1">1v1</TabsTrigger>
                <TabsTrigger value="Teams">Teams</TabsTrigger>
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
            isPending={updateChallengeMutation.isPending}
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
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !joinPvpMatchId.trim() || joinPvpMatchMutation.isPending
                }
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

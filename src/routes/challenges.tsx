import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'
import { api } from '@/stores/userStore'
import { useIsAdmin } from '@/stores/userStore'
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
import type { Challenge } from '@/models/challenge'
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
  }
}

function splitMultiline(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
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
                <SelectTrigger id="challenge-starter-language" className="w-44">
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = useIsAdmin()

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

  const challenges = challengesQuery.data?.data ?? []

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
          <div className="flex justify-end">
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

          <div className="relative w-full xl:w-96">
            <Label htmlFor="challenge-search" className="sr-only">
              Search challenges
            </Label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="challenge-search"
              placeholder="Filter problems..."
              className="pl-10 bg-background border-border"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
            />
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
                      onClick={() =>
                        navigate({
                          to: '/challenge',
                          search: { id: challenge.id },
                        })
                      }
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
                                <TooltipContent>Update this challenge</TooltipContent>
                              </Tooltip>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              disabled={deleteChallengeMutation.isPending}
                              onClick={async (event) => {
                                event.stopPropagation()

                                if (
                                  !window.confirm(
                                    `Delete challenge "${challenge.title}"?`,
                                  )
                                ) {
                                  return
                                }

                                setAdminActionError(null)
                                await deleteChallengeMutation.mutateAsync(
                                  challenge.id,
                                )
                              }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Delete this challenge</TooltipContent>
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
      </div>
    </div>
  )
}

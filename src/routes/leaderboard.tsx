import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Zap, AlertCircle, Medal } from 'lucide-react'
import { useState } from 'react'
import { api, useUser } from '@/stores/userStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Rank,
  RANK_THRESHOLDS,
  RANKS_ORDERED,
  type ScoreLeaderboardItem,
} from '@/models/leaderboard'
import type { User } from '@/models/user'

export const Route = createFileRoute('/leaderboard')({
  component: RouteComponent,
})



const RANK_CONFIG: Record<
  Rank,
  {
    label: string
    text: string       
    bg: string         
    border: string     
    bar: string        
  }
> = {
  [Rank.IRON]: {
    label: 'Iron',
    text:   'text-zinc-500 dark:text-zinc-400',
    bg:     'bg-zinc-500/10 dark:bg-zinc-400/10',
    border: 'border-zinc-500/40 dark:border-zinc-400/30',
    bar:    'bg-zinc-500 dark:bg-zinc-400',
  },
  [Rank.BRONZE]: {
    label: 'Bronze',
    text:   'text-amber-700 dark:text-amber-600',
    bg:     'bg-amber-700/10 dark:bg-amber-600/10',
    border: 'border-amber-700/40 dark:border-amber-600/30',
    bar:    'bg-amber-700 dark:bg-amber-600',
  },
  [Rank.SILVER]: {
    label: 'Silver',
    text:   'text-slate-500 dark:text-slate-300',
    bg:     'bg-slate-500/10 dark:bg-slate-300/10',
    border: 'border-slate-500/40 dark:border-slate-300/30',
    bar:    'bg-slate-500 dark:bg-slate-300',
  },
  [Rank.GOLD]: {
    label: 'Gold',
    text:   'text-yellow-600 dark:text-yellow-400',
    bg:     'bg-yellow-600/10 dark:bg-yellow-400/10',
    border: 'border-yellow-600/40 dark:border-yellow-400/30',
    bar:    'bg-yellow-600 dark:bg-yellow-400',
  },
  [Rank.PLATINUM]: {
    label: 'Platinum',
    text:   'text-teal-600 dark:text-teal-400',
    bg:     'bg-teal-600/10 dark:bg-teal-400/10',
    border: 'border-teal-600/40 dark:border-teal-400/30',
    bar:    'bg-teal-600 dark:bg-teal-400',
  },
  [Rank.DIAMOND]: {
    label: 'Diamond',
    text:   'text-sky-600 dark:text-sky-300',
    bg:     'bg-sky-600/10 dark:bg-sky-300/10',
    border: 'border-sky-600/40 dark:border-sky-300/30',
    bar:    'bg-sky-600 dark:bg-sky-300',
  },
  [Rank.MASTER]: {
    label: 'Master',
    text:   'text-purple-600 dark:text-purple-400',
    bg:     'bg-purple-600/10 dark:bg-purple-400/10',
    border: 'border-purple-600/40 dark:border-purple-400/30',
    bar:    'bg-purple-600 dark:bg-purple-400',
  },
  [Rank.GRANDMASTER]: {
    label: 'Grandmaster',
    text:   'text-rose-600 dark:text-rose-400',
    bg:     'bg-rose-600/10 dark:bg-rose-400/10',
    border: 'border-rose-600/40 dark:border-rose-400/30',
    bar:    'bg-rose-600 dark:bg-rose-400',
  },
}



function getRankStyle(rank: number): string {
  if (rank === 1) return 'text-yellow-400'
  if (rank === 2) return 'text-slate-300'
  if (rank === 3) return 'text-amber-600'
  return 'text-muted-foreground'
}

function getRankLabel(rank: number) {
  if (rank === 1) return <Medal className="inline h-4 w-4 text-yellow-400" />
  if (rank === 2) return <Medal className="inline h-4 w-4 text-slate-300" />
  if (rank === 3) return <Medal className="inline h-4 w-4 text-amber-600" />
  return <span className="font-mono text-xs">#{rank}</span>
}

function shortenUserId(userId: string): string {
  return userId.slice(0, 8).toUpperCase()
}

function RankBadge({ rank }: { rank: Rank }) {
  const config = RANK_CONFIG[rank]
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${config.text} ${config.bg} ${config.border}`}
    >
      {config.label}
    </span>
  )
}

function RankProgressBar({
  rank,
  progress,
}: {
  rank: Rank
  progress: number
}) {
  const config = RANK_CONFIG[rank]
  const isMax = rank === Rank.GRANDMASTER
  const threshold = RANK_THRESHOLDS[rank]

  return (
    <div className="space-y-1 min-w-24">
      <div className="h-1.5 w-full rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full transition-all ${config.bar}`}
          style={{ width: `${isMax ? 100 : progress}%` }}
        />
      </div>
      {!isMax ? (
        <p className="text-[10px] text-muted-foreground font-mono">
          {threshold.min} – {threshold.max} pts
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground font-mono">
          {threshold.min}+ pts
        </p>
      )}
    </div>
  )
}



function ScoreLeaderboard({
  currentUserId,
  scope,
}: {
  currentUserId: string | undefined
  scope: string
}) {
  const scoreQuery = useQuery<ScoreLeaderboardItem[]>({
    queryKey: ['leaderboard', 'score', scope],
    queryFn: async () => {
      const { data } = await api.get<
        ScoreLeaderboardItem[] | { entries: ScoreLeaderboardItem[] }
      >('/leaderboard/score', { params: { scope } })
      return Array.isArray(data) ? data : (data?.entries ?? [])
    },
  })

  if (scoreQuery.isLoading) {
    return (
      <div className="border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading score leaderboard...
      </div>
    )
  }

  if (scoreQuery.isError || !scoreQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unavailable</AlertTitle>
        <AlertDescription>
          Unable to load the score leaderboard.
        </AlertDescription>
      </Alert>
    )
  }

  const entries = scoreQuery.data

  if (entries.length === 0) {
    return (
      <div className="border border-border bg-card p-8 text-sm text-muted-foreground">
        No entries yet. Complete challenges to appear on the leaderboard.
      </div>
    )
  }

  return (
    <div className="border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-16 text-xs uppercase text-muted-foreground px-6">
              Rank
            </TableHead>
            <TableHead className="text-xs uppercase text-foreground">
              Player
            </TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">
              Tier
            </TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">
              Progress
            </TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">
              Solved
            </TableHead>
            <TableHead className="text-right text-xs uppercase text-muted-foreground px-6">
              Score
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const position = index + 1
            const isCurrentUser = entry.userId === currentUserId

            return (
              <TableRow
                key={entry.userId}
                className={`border-border h-16 transition-colors ${
                  isCurrentUser
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : 'hover:bg-primary/5'
                }`}
              >
                <TableCell
                  className={`px-6 font-bold ${getRankStyle(position)}`}
                >
                  {getRankLabel(position)}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 shrink-0 rounded border flex items-center justify-center text-xs font-bold uppercase ${RANK_CONFIG[entry.rank].bg} ${RANK_CONFIG[entry.rank].border} ${RANK_CONFIG[entry.rank].text}`}
                    >
                      {shortenUserId(entry.userId)[0]}
                    </div>
                    <div>
                      {}
                      <p className="font-mono text-xs text-foreground">
                        {isCurrentUser ? (
                          <>
                            <span className="font-bold">You</span>
                            <Badge className="ml-2 bg-primary/10 text-primary text-[10px] uppercase border-primary/20">
                              You
                            </Badge>
                          </>
                        ) : (
                          shortenUserId(entry.userId)
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <RankBadge rank={entry.rank} />
                </TableCell>

                <TableCell>
                  <RankProgressBar
                    rank={entry.rank}
                    progress={entry.rankProgress}
                  />
                </TableCell>

                <TableCell>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {entry.challengeCompletions}
                  </span>
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground tracking-widest">
                    solved
                  </span>
                </TableCell>

                <TableCell className="text-right px-6">
                  <span
                    className={`font-mono text-sm font-bold ${RANK_CONFIG[entry.rank].text}`}
                  >
                    {entry.totalScore.toLocaleString()}
                  </span>
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                    pts
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}



function XpLeaderboard({
  currentUserId,
}: {
  currentUserId: string | undefined
}) {
  const xpQuery = useQuery<User[]>({
    queryKey: ['leaderboard', 'xp'],
    queryFn: async () => {
      const { data } = await api.get<User[] | { entries: User[] }>(
        '/leaderboard/xp',
      )
      return Array.isArray(data) ? data : (data?.entries ?? [])
    },
  })

  if (xpQuery.isLoading) {
    return (
      <div className="border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading XP leaderboard...
      </div>
    )
  }

  if (xpQuery.isError || !xpQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unavailable</AlertTitle>
        <AlertDescription>Unable to load the XP leaderboard.</AlertDescription>
      </Alert>
    )
  }

  const users = xpQuery.data

  if (users.length === 0) {
    return (
      <div className="border border-border bg-card p-8 text-sm text-muted-foreground">
        No entries yet. Log in and complete challenges to earn XP.
      </div>
    )
  }

  return (
    <div className="border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-16 text-xs uppercase text-muted-foreground px-6">
              Rank
            </TableHead>
            <TableHead className="text-xs uppercase text-foreground">
              Player
            </TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">
              Role
            </TableHead>
            <TableHead className="text-right text-xs uppercase text-muted-foreground px-6">
              XP (All-time)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const position = index + 1
            const isCurrentUser = user.id === currentUserId

            return (
              <TableRow
                key={user.id}
                className={`border-border h-16 transition-colors ${
                  isCurrentUser
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : 'hover:bg-primary/5'
                }`}
              >
                <TableCell
                  className={`px-6 font-bold ${getRankStyle(position)}`}
                >
                  {getRankLabel(position)}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 rounded border border-primary/20 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                      {user.username?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {user.username}
                        {isCurrentUser ? (
                          <Badge className="ml-2 bg-primary/10 text-primary text-[10px] uppercase border-primary/20">
                            You
                          </Badge>
                        ) : null}
                      </p>
                      {user.githubHandle ? (
                        <p className="text-[11px] text-muted-foreground">
                          @{user.githubHandle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] bg-muted/50 text-muted-foreground uppercase"
                  >
                    {user.type}
                  </Badge>
                </TableCell>

                <TableCell className="text-right px-6">
                  <span className="font-mono text-sm font-bold text-primary">
                    {user.xp?.toLocaleString() ?? 0}
                  </span>
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                    xp
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}



function RankLegend() {
  return (
    <div className="rounded border border-border bg-muted/10 p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Rank Tiers
      </p>
      <div className="flex flex-wrap gap-2">
        {RANKS_ORDERED.map((rank) => {
          const config = RANK_CONFIG[rank]
          const threshold = RANK_THRESHOLDS[rank]
          return (
            <div
              key={rank}
              className={`flex items-center gap-2 rounded border px-3 py-1.5 ${config.bg} ${config.border}`}
            >
              <span className={`text-[10px] font-bold uppercase ${config.text}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {threshold.max === Infinity
                  ? `${threshold.min}+`
                  : `${threshold.min}–${threshold.max}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}



function RouteComponent() {
  const [activeTab, setActiveTab] = useState<'score' | 'xp'>('score')
  const [scoreScope, setScoreScope] = useState<string>('season')
  const user = useUser()

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-3xl uppercase tracking-tight text-foreground">
              Leaderboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Top players ranked by score and XP. Complete challenges to climb
            the ranks.
          </p>
        </div>

        {}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'score' | 'xp')}
        >
          <TabsList className="bg-background border border-border">
            <TabsTrigger value="score" className="gap-2">
              <Trophy className="h-3.5 w-3.5" />
              Score (Seasonal)
            </TabsTrigger>
            <TabsTrigger value="xp" className="gap-2">
              <Zap className="h-3.5 w-3.5" />
              XP (All-time)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {}
        {activeTab === 'score' ? (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground">
              Time Period:
            </label>
            <Select value={scoreScope} onValueChange={setScoreScope}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="season">Season</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {}
        <div className="rounded border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
          {activeTab === 'score' ? (
            <span>
              <span className="font-bold text-foreground">Score</span> is
              earned by solving challenges in the{' '}
              {scoreScope === 'season'
                ? 'current season'
                : scoreScope === '24h'
                  ? 'last 24 hours'
                  : scoreScope === '7d'
                    ? 'last 7 days'
                    : 'last 30 days'}
              . Harder difficulties and PVP/Teams wins award more points. Ranks
              reset every season.
            </span>
          ) : (
            <span>
              <span className="font-bold text-foreground">XP</span> is earned
              by logging in daily and completing challenges. It reflects
              all-time progression and never resets.
            </span>
          )}
        </div>

        {}
        {activeTab === 'score' ? <RankLegend /> : null}

        {}
        {activeTab === 'score' ? (
          <ScoreLeaderboard currentUserId={user?.id} scope={scoreScope} />
        ) : (
          <XpLeaderboard currentUserId={user?.id} />
        )}
      </div>
    </div>
  )
}
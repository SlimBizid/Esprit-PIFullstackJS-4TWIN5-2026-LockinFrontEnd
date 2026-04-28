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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LeaderboardEntry } from '@/models/leaderboard'
import type { User } from '@/models/user'

export const Route = createFileRoute('/leaderboard')({
  component: RouteComponent,
})

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

function getDifficultyColor(completions: number) {
  if (completions >= 50) return 'text-rarity-epic'
  if (completions >= 20) return 'text-amber-500'
  return 'text-emerald-500'
}

function ScoreLeaderboard({
  currentUserId,
}: {
  currentUserId: string | undefined
}) {
  const scoreQuery = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', 'score'],
    queryFn: async () => {
      const { data } = await api.get<
        LeaderboardEntry[] | { entries: LeaderboardEntry[] }
      >('/leaderboard/score')
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
              Challenges
            </TableHead>
            <TableHead className="text-right text-xs uppercase text-muted-foreground px-6">
              Score
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const rank = index + 1
            const isCurrentUser = entry.userId === currentUserId

            return (
              <TableRow
                key={entry.id}
                className={`border-border h-16 transition-colors ${
                  isCurrentUser
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : 'hover:bg-primary/5'
                }`}
              >
                <TableCell className={`px-6 font-bold ${getRankStyle(rank)}`}>
                  {getRankLabel(rank)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 rounded border border-primary/20 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                      {entry.user?.username?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {entry.user?.username ?? entry.userId}
                        {isCurrentUser ? (
                          <Badge className="ml-2 bg-primary/10 text-primary text-[10px] uppercase border-primary/20">
                            You
                          </Badge>
                        ) : null}
                      </p>
                      {entry.user?.githubHandle ? (
                        <p className="text-[11px] text-muted-foreground">
                          @{entry.user.githubHandle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-sm font-bold ${getDifficultyColor(entry.challengeCompletions)}`}
                  >
                    {entry.challengeCompletions}
                  </span>
                  <span className="ml-1 text-[10px] uppercase text-muted-foreground tracking-widest">
                    solved
                  </span>
                </TableCell>
                <TableCell className="text-right px-6">
                  <span className="font-mono text-sm font-bold text-primary">
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
              XP
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const rank = index + 1
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
                <TableCell className={`px-6 font-bold ${getRankStyle(rank)}`}>
                  {getRankLabel(rank)}
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

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<'score' | 'xp'>('score')
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
            Top players ranked by score and XP. Complete challenges to climb the
            ranks.
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
              Score
            </TabsTrigger>
            <TabsTrigger value="xp" className="gap-2">
              <Zap className="h-3.5 w-3.5" />
              XP
            </TabsTrigger>
          </TabsList>
          <TabsContent value="score" />
          <TabsContent value="xp" />
        </Tabs>

        {}
        <div className="rounded border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
          {activeTab === 'score' ? (
            <span>
              <span className="font-bold text-foreground">Score</span> is earned
              by solving challenges. Harder difficulties and PVP/Team wins award
              more points.
            </span>
          ) : (
            <span>
              <span className="font-bold text-foreground">XP</span> is earned by
              logging in daily and completing challenges. It reflects overall
              activity.
            </span>
          )}
        </div>

        {}
        {activeTab === 'score' ? (
          <ScoreLeaderboard currentUserId={user?.id} />
        ) : (
          <XpLeaderboard currentUserId={user?.id} />
        )}
      </div>
    </div>
  )
}

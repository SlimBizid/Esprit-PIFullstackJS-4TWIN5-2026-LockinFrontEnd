import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowRight, Layers3, Trophy } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ACHIEVEMENT_TYPE_BLURBS,
  achievementTypeToSlug,
  type Achievement,
  type AchievementType,
} from '@/models/achievement'
import { api, useUser } from '@/stores/userStore'

function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback

  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  return fallback
}

export const Route = createFileRoute('/achievements/')({
  component: AchievementsHubPage,
})

function AchievementsHubPage() {
  const user = useUser()

  const typesQuery = useQuery({
    queryKey: ['achievement-types'],
    queryFn: async () => {
      const { data } = await api.get('/achievement/types')
      return data as AchievementType[]
    },
  })

  const achievementsQuery = useQuery({
    queryKey: ['user-achievements', user?.username],
    enabled: !!user?.username,
    queryFn: async () => {
      const { data } = await api.get(`/users/${user?.username}/achievements`)
      return data as Achievement[]
    },
  })

  if (!user?.username || typesQuery.isLoading || achievementsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-primary animate-pulse uppercase tracking-widest text-sm">
          Loading achievements...
        </p>
      </div>
    )
  }

  if (typesQuery.isError || achievementsQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertTitle>Failed to load achievements</AlertTitle>
          <AlertDescription>
            {getErrorMessage(
              typesQuery.error ?? achievementsQuery.error,
              'Please try again in a moment.',
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const achievements = achievementsQuery.data ?? []
  const types = typesQuery.data ?? []

  return (
    <main className="min-h-screen bg-background px-6 py-20 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden  border bg-primary/10 border-primary/15 px-6 py-10 sm:px-10">
          <div className="absolute right-0 top-0 h-44 w-44 hidden bg-primary/10 blur-3xl" />
          <div className="relative space-y-4">
            <Badge
              variant="outline"
              className="border-primary/30 bg-background/40"
            >
              Achievement archive
            </Badge>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="border border-primary/20 bg-primary/10 p-3">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-mono-one uppercase tracking-tight text-foreground">
                    Achievements
                  </h1>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Browse your progress by category and dive into each lane to
                  see the full timeline of what you have unlocked and what is
                  still ahead.
                </p>
              </div>
              <div className="border border-border/60 bg-background/60 px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Total achievements
                </div>
                <div className="mt-1 text-2xl font-black">
                  {achievements.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {types.map((type, index) => {
            const achievementsForType = achievements.filter(
              (achievement) => achievement.type === type,
            )
            const unlockedCount = achievementsForType.filter(
              (achievement) => achievement.unlocked,
            ).length
            const slug = achievementTypeToSlug(type)

            return (
              <Link
                key={type}
                to="/achievements/$type"
                params={{ type: slug }}
                className="group relative overflow-hidden border border-border/60 bg-card/80 p-6 transition-colors duration-300 hover:border-primary/35 hover:shadow-[0_22px_60px_rgba(0,0,0,0.25)]"
              >
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    background:
                      index % 3 === 0
                        ? 'rgba(7, 189, 101, 0.16)'
                        : index % 3 === 1
                          ? 'rgba(248,113,113,0.16)'
                          : 'rgba(250,204,21,0.16)',
                  }}
                />
                <div className="relative space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-black leading-tight text-foreground">
                        {type}
                      </h2>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {ACHIEVEMENT_TYPE_BLURBS[type]}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      <span>Unlocked</span>
                      <span>
                        {unlockedCount}/{achievementsForType.length}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width:
                            achievementsForType.length === 0
                              ? '0%'
                              : `${(unlockedCount / achievementsForType.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}

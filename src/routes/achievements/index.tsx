import { createFileRoute } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'

import { AchievementTypeCard } from '@/components/achievement-type-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAchievementTypes } from '@/hooks/use-achievement-types'
import { useUserAchievements } from '@/hooks/use-user-achievements'
import { getApiErrorMessage } from '@/lib/api-error'
import { useUser } from '@/stores/userStore'

export const Route = createFileRoute('/achievements/')({
  component: AchievementsHubPage,
})

function AchievementsHubPage() {
  const user = useUser()
  const typesQuery = useAchievementTypes()
  const achievementsQuery = useUserAchievements(user?.username)

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
            {getApiErrorMessage(
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
  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length

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
              <div className="border border-border/60 bg-background/60 px-4 py-3 text-center text-sm">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Your achievements
                </div>
                <div className="mt-1 text-2xl font-black">
                  {unlockedAchievements}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {types.map((type, index) => (
            <AchievementTypeCard
              key={type}
              achievements={achievements}
              index={index}
              type={type}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

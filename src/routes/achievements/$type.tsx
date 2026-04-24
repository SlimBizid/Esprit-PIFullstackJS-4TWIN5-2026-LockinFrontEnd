import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { AchievementTimeline } from '@/components/achievement-timeline'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAchievementTypes } from '@/hooks/use-achievement-types'
import { useUserAchievements } from '@/hooks/use-user-achievements'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  ACHIEVEMENT_TYPE_BLURBS,
  slugToAchievementType,
} from '@/models/achievement'
import { useUser } from '@/stores/userStore'

export const Route = createFileRoute('/achievements/$type')({
  component: AchievementTypePage,
})

function AchievementTypePage() {
  const { type: typeSlug } = Route.useParams()
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

  const selectedType = slugToAchievementType(typeSlug, typesQuery.data ?? [])

  if (!selectedType) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertTitle>Unknown achievement type</AlertTitle>
          <AlertDescription>
            The requested achievement category does not exist.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const achievements = (achievementsQuery.data ?? [])
    .filter((achievement) => achievement.type === selectedType)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )

  return (
    <AchievementTimeline
      achievements={achievements}
      eyebrow="Achievement lane"
      title={selectedType}
      description={ACHIEVEMENT_TYPE_BLURBS[selectedType]}
      action={
        <Button asChild variant="outline" size="icon" className="rounded-none">
          <Link to="/achievements">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      }
    />
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'

import { AchievementTimeline } from '@/components/achievement-timeline'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  ACHIEVEMENT_TYPE_BLURBS,
  slugToAchievementType,
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

export const Route = createFileRoute('/achievements/$type')({
  component: AchievementTypePage,
})

function AchievementTypePage() {
  const { type: typeSlug } = Route.useParams()
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

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertCircle, Check, ImagePlus, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  MessageDialog,
  type MessageDialogState,
} from '@/components/message-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AchievementType } from '@/models/achievement'
import type { Cosmetic } from '@/models/cosmetic'
import { api, useIsAdmin } from '@/stores/userStore'

function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  if (error.response?.status === 401) return 'You must be logged in.'
  if (error.response?.status === 403)
    return 'You do not have permission to create achievements.'

  return fallback
}

export const Route = createFileRoute('/admin/achievements/new')({
  component: NewAchievementPage,
})

function NewAchievementPage() {
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<AchievementType | ''>('')
  const [image, setImage] = useState<File | null>(null)
  const [selectedCosmeticIds, setSelectedCosmeticIds] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageDialogState | null>(null)

  const typesQuery = useQuery({
    queryKey: ['achievement-types'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get('/achievement/types')
      return data as AchievementType[]
    },
  })

  const cosmeticsQuery = useQuery({
    queryKey: ['cosmetics', 'achievement-rewards'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get('/cosmetics/available-rewards')
      return data as Cosmetic[]
    },
  })

  const selectedCosmetics = useMemo(
    () =>
      (cosmeticsQuery.data ?? []).filter((cosmetic) =>
        selectedCosmeticIds.includes(cosmetic.id),
      ),
    [cosmeticsQuery.data, selectedCosmeticIds],
  )

  useEffect(() => {
    if (type === '' && (typesQuery.data?.length ?? 0) > 0) {
      setType(typesQuery.data?.[0] ?? '')
    }
  }, [type, typesQuery.data])

  const createAchievementMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim()
      const trimmedDescription = description.trim()

      if (!trimmedName) {
        throw new Error('Achievement name is required.')
      }

      if (!trimmedDescription) {
        throw new Error('Achievement description is required.')
      }

      if (!type) {
        throw new Error('Achievement type is required.')
      }

      if (!image) {
        throw new Error('Achievement image is required.')
      }

      const payload = new FormData()
      payload.append('name', trimmedName)
      payload.append('description', trimmedDescription)
      payload.append('type', type)
      payload.append('image', image)

      for (const cosmeticId of selectedCosmeticIds) {
        payload.append('cosmeticIds', cosmeticId)
      }

      await api.post('/achievement', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    onSuccess: async () => {
      setName('')
      setDescription('')
      setType(typesQuery.data?.[0] ?? '')
      setImage(null)
      setSelectedCosmeticIds([])
      setFormError(null)
      await queryClient.invalidateQueries({
        queryKey: ['achievements'],
      })
      setMessage({
        title: 'Achievement created',
        description: 'The new achievement has been published successfully.',
      })
    },
    onError: (error) => {
      const description =
        error instanceof Error && !axios.isAxiosError(error)
          ? error.message
          : getErrorMessage(error, 'Failed to create achievement.')

      setFormError(description)
    },
  })

  function toggleCosmetic(cosmeticId: string) {
    setSelectedCosmeticIds((current) =>
      current.includes(cosmeticId)
        ? current.filter((id) => id !== cosmeticId)
        : [...current, cosmeticId],
    )
    setFormError(null)
  }

  function submitForm() {
    setFormError(null)
    createAchievementMutation.mutate()
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 pb-16 pt-28">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Admin Only</AlertTitle>
          <AlertDescription>
            Achievement management is only available to admins.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-16 pt-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline">Admin tools</Badge>
            <h1 className="text-3xl font-black tracking-tight">
              Create Achievement
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Upload an achievement badge, add the unlock details, and
              optionally attach cosmetic rewards.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/achievements">View achievements</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/challenges">Back to challenges</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Achievement details</CardTitle>
              <CardDescription>
                The backend expects multipart form data with the file field
                named <code>image</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {formError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to create achievement</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="achievement-name">Name</Label>
                <Input
                  id="achievement-name"
                  placeholder="First Blood"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setFormError(null)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement-description">Description</Label>
                <textarea
                  id="achievement-description"
                  placeholder="Awarded to players who complete their first challenge."
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    setFormError(null)
                  }}
                  className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(value) => {
                    setType(value as AchievementType)
                    setFormError(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        typesQuery.isLoading
                          ? 'Loading types...'
                          : 'Select achievement type'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {typesQuery.data?.map((achievementType) => (
                      <SelectItem key={achievementType} value={achievementType}>
                        {achievementType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement-image">Image</Label>
                <Input
                  id="achievement-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setImage(event.target.files?.[0] ?? null)
                    setFormError(null)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {image
                    ? `Selected file: ${image.name}`
                    : 'Choose the badge image that will be uploaded to the backend.'}
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={submitForm}
                  disabled={createAchievementMutation.isPending}
                >
                  {createAchievementMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create achievement</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward cosmetics</CardTitle>
              <CardDescription>
                Select any cosmetics that should be linked to this achievement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {selectedCosmeticIds.length} selected
                </Badge>
                {selectedCosmetics.slice(0, 2).map((cosmetic) => (
                  <Badge key={cosmetic.id} variant="outline">
                    {cosmetic.cosmeticTitle}
                  </Badge>
                ))}
              </div>

              {cosmeticsQuery.isLoading ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                  Loading cosmetics...
                </div>
              ) : null}

              {cosmeticsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Failed to load cosmetics</AlertTitle>
                  <AlertDescription>
                    {getErrorMessage(
                      cosmeticsQuery.error,
                      'The reward list could not be loaded.',
                    )}
                  </AlertDescription>
                </Alert>
              ) : null}

              {!cosmeticsQuery.isLoading &&
              !cosmeticsQuery.isError &&
              (cosmeticsQuery.data?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                  No cosmetics are available yet.
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {cosmeticsQuery.data?.map((cosmetic) => {
                  const selected = selectedCosmeticIds.includes(cosmetic.id)

                  return (
                    <button
                      key={cosmetic.id}
                      type="button"
                      onClick={() => toggleCosmetic(cosmetic.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        {cosmetic.imageUrl ? (
                          <img
                            src={cosmetic.imageUrl}
                            alt={cosmetic.cosmeticTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {cosmetic.cosmeticTitle}
                        </div>
                        <div className="truncate text-xs text-muted-foreground capitalize">
                          {cosmetic.cosmeticType} • {cosmetic.cosmeticRarity}
                        </div>
                      </div>

                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MessageDialog
        message={message}
        onOpenChange={(open) => {
          if (!open) {
            setMessage(null)
          }
        }}
      />
    </>
  )
}

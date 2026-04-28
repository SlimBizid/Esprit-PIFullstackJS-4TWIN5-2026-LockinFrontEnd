import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Palette, ShoppingBag } from 'lucide-react'

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
import type { Cosmetic, CosmeticType } from '@/models/cosmetic'
import { api, useIsAuthenticated, useUser } from '@/stores/userStore'

type OwnedCosmetic = Partial<Cosmetic> & {
  equipped?: boolean
  type?: CosmeticType
}

type UserProfile = {
  username: string
  cosmetics?: Array<string | OwnedCosmetic>
}

function getCosmeticDisplay(item: string | OwnedCosmetic) {
  if (typeof item === 'string') {
    return {
      key: item,
      id: null,
      label: item,
      imageUrl: null,
      type: null,
      equipped: false,
    }
  }

  const cosmeticType = 'type' in item ? item.type : undefined
  const equipped = 'equipped' in item ? item.equipped : false

  return {
    key: item.id ?? item.cosmeticTitle ?? item.imageUrl ?? 'owned-cosmetic',
    id: item.id ?? null,
    label:
      item.cosmeticTitle ??
      item.cosmeticType ??
      cosmeticType ??
      'Owned cosmetic',
    imageUrl: item.imageUrl ?? null,
    type: item.cosmeticType ?? cosmeticType ?? null,
    equipped: equipped ?? false,
  }
}

export const Route = createFileRoute('/profile/cosmetics')({
  component: ProfileCosmeticsPage,
})

function ProfileCosmeticsPage() {
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const currentUser = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equippingId, setEquippingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.username) {
      setLoading(false)
      return
    }

    api
      .get<UserProfile>(`/users/profile/${currentUser.username}`)
      .then((res) => setProfile(res.data))
      .catch(() => setError('Failed to load your cosmetics.'))
      .finally(() => setLoading(false))
  }, [currentUser?.username, isAuthenticated])

  async function refreshProfile() {
    if (!currentUser?.username) return
    const { data } = await api.get<UserProfile>(
      `/users/profile/${currentUser.username}`,
    )
    setProfile(data)
  }

  async function handleEquip(cosmeticId: string) {
    try {
      setEquippingId(cosmeticId)
      await api.patch(`/users/me/equipped-cosmetics/${cosmeticId}`)
      await refreshProfile()
    } catch {
      setError('Failed to equip cosmetic.')
    } finally {
      setEquippingId(null)
    }
  }

  if (!isAuthenticated || !currentUser?.username) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm space-y-4 text-center">
          <Alert>
            <ShoppingBag className="h-4 w-4" />
            <AlertTitle>Sign in to view your cosmetics</AlertTitle>
            <AlertDescription>
              You need to log in before opening your cosmetic locker.
            </AlertDescription>
          </Alert>
          <Button onClick={() => void navigate({ to: '/auth/login' })}>
            Go to login
          </Button>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Loading cosmetics...
        </p>
      </main>
    )
  }

  const cosmetics = profile?.cosmetics ?? []

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <Button asChild variant="outline" className="w-fit">
        <Link to="/profile/$userId" params={{ userId: currentUser.username }}>
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
      </Button>

      <Card className="border-border/70 bg-background shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <CardHeader>
          <Badge
            variant="outline"
            className="w-fit border-primary/25 bg-primary/10 text-primary"
          >
            Cosmetic locker
          </Badge>
          <CardTitle className="text-3xl font-black text-foreground">
            Your owned cosmetics
          </CardTitle>
          <CardDescription className="text-base">
            Equip one cosmetic per type at a time. Equipping a new cosmetic
            automatically replaces the currently equipped cosmetic for that same
            type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {cosmetics.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4">
              {cosmetics.map((item) => {
                const cosmetic = getCosmeticDisplay(item)

                return (
                  <li
                    key={cosmetic.key}
                    className="overflow-hidden rounded-xl border border-border bg-background/45"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background/70">
                        {cosmetic.imageUrl ? (
                          <img
                            src={cosmetic.imageUrl}
                            alt={cosmetic.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Palette className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-foreground">
                          {cosmetic.label}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {cosmetic.type ? (
                            <Badge variant="outline" className="uppercase">
                              {cosmetic.type}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={
                              cosmetic.equipped ? 'default' : 'secondary'
                            }
                            className="uppercase"
                          >
                            {cosmetic.equipped ? 'Equipped' : 'Owned'}
                          </Badge>
                        </div>
                      </div>

                      {cosmetic.id ? (
                        <Button
                          variant={cosmetic.equipped ? 'secondary' : 'outline'}
                          disabled={
                            cosmetic.equipped || equippingId === cosmetic.id
                          }
                          onClick={() => void handleEquip(cosmetic.id!)}
                        >
                          {cosmetic.equipped
                            ? 'Equipped'
                            : equippingId === cosmetic.id
                              ? 'Equipping...'
                              : 'Equip'}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
              <Palette className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                You do not own any cosmetics yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Github, Mail, Shield, Star, Palette, Pencil } from 'lucide-react'
import { api, useUser } from '@/stores/userStore'
import { UserAchievementsPreview } from '@/components/userprofileachievements'
import type { Cosmetic, CosmeticType } from '@/models/cosmetic'
interface UserProfile {
  id: string
  username: string
  githubHandle: string | null
  email: string
  type: 'admin' | 'player'
  createdAt: string
  updatedAt: string
  xp: number
  cosmetics?: Array<string | Partial<Cosmetic> | EquippedCosmeticRecord>
}

type EquippedCosmeticRecord = {
  id?: string
  imageUrl?: string
  cosmeticTitle?: string
  cosmeticType?: CosmeticType
  type?: CosmeticType
  equipped?: boolean
}

function isCosmeticRecord(value: unknown): value is EquippedCosmeticRecord {
  return typeof value === 'object' && value !== null
}

function getEquippedAvatar(user: UserProfile): EquippedCosmeticRecord | null {
  for (const cosmetic of user.cosmetics ?? []) {
    if (
      isCosmeticRecord(cosmetic) &&
      cosmetic.imageUrl &&
      cosmetic.equipped &&
      (cosmetic.cosmeticType === 'avatar' || cosmetic.type === 'avatar')
    ) {
      return cosmetic
    }
  }

  return null
}

function getCosmeticDisplay(
  item: string | Partial<Cosmetic> | EquippedCosmeticRecord,
) {
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
    key: item.id ?? item.cosmeticTitle ?? item.imageUrl ?? 'equipped-cosmetic',
    id: item.id ?? null,
    label:
      item.cosmeticTitle ??
      item.cosmeticType ??
      cosmeticType ??
      'Equipped cosmetic',
    imageUrl: item.imageUrl ?? null,
    type: item.cosmeticType ?? cosmeticType ?? null,
    equipped: equipped ?? false,
  }
}

export const Route = createFileRoute('/profile/$userId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { userId } = Route.useParams()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentUser = useUser()

  useEffect(() => {
    api
      .get<UserProfile>(`/users/profile/${userId}`)
      .then((res) => setUser(res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-sm text-primary animate-pulse tracking-widest uppercase">
          Loading profile...
        </p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive font-bold text-center font-mono">
          {error ?? 'User not found.'}
        </div>
      </div>
    )
  }

  const joinedAt = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const cosmetics = user.cosmetics ?? []
  const previewCosmetics = cosmetics.slice(0, 3)
  const totalXp = user.xp ?? null
  const isOwnProfile = currentUser?.username === user.username
  const equippedAvatar = getEquippedAvatar(user)

  return (
    <main
      aria-labelledby="profile-heading"
      className="min-h-screen bg-background w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-32"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {equippedAvatar?.imageUrl ? (
              <div className="w-20 h-20 overflow-hidden rounded-2xl border border-primary/30 bg-background/70 shadow-[0_0_20px_rgba(0,207,186,0.08)] flex-shrink-0">
                <img
                  src={equippedAvatar.imageUrl}
                  alt={`${user.username} equipped avatar`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  id="profile-heading"
                  className="text-3xl md:text-4xl font-mono-one text-foreground uppercase tracking-tight"
                >
                  {user.username}
                </h1>

                {user.type === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold tracking-widest text-destructive uppercase bg-background border border-destructive/20 px-2 py-1 rounded">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}

                {isOwnProfile && (
                  <Link to="/profile/edit">
                    <button className="inline-flex items-center gap-1.5 text-sm font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                      <Pencil className="w-3 h-3" />
                      Edit Profile
                    </button>
                  </Link>
                )}
              </div>

              <p className="text-xs font-mono text-foreground uppercase tracking-widest">
                Joined {joinedAt}
              </p>
            </div>

            {/* XP */}
            {totalXp !== null ? (
              <div className="flex flex-col items-center justify-center px-6 py-4 bg-background border border-primary/30 rounded-xl shadow-[0_0_20px_rgba(0,207,186,0.08)]">
                <span className="text-2xl font-mono-one text-primary font-bold">
                  {totalXp.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  Total XP
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-4 bg-background border border-border rounded-xl opacity-40">
                <Star className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="text-2xl font-mono-one text-muted-foreground font-bold">
                  —
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  Total XP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info + Cosmetics + Achievements */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Info */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-6">
              Account Info
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Email
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border">
                <Github className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    GitHub
                  </p>
                  {user.githubHandle ? (
                    <a
                      href={`https://github.com/${user.githubHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-mono hover:underline"
                    >
                      @{user.githubHandle}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground font-mono italic">
                      Not linked
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Role
                  </p>
                  <p className="text-sm text-foreground font-mono capitalize">
                    {user.type}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cosmetics */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
                Cosmetics
              </h2>
              {isOwnProfile ? (
                <Link to="/profile/cosmetics">
                  <p className="text-sm font-bold tracking-widest text-primary uppercase hover:underline">
                    See All
                  </p>
                </Link>
              ) : null}
            </div>

            {previewCosmetics.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3">
                {previewCosmetics.map((item) => {
                  const cosmetic = getCosmeticDisplay(item)

                  return (
                    <li
                      key={cosmetic.key}
                      className="overflow-hidden rounded-xl border border-border bg-background/50"
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background/70">
                          {cosmetic.imageUrl ? (
                            <img
                              src={cosmetic.imageUrl}
                              alt={cosmetic.label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Palette className="w-5 h-5 text-primary" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-mono text-foreground">
                            {cosmetic.label}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {cosmetic.type
                              ? cosmetic.type === 'avatar' && cosmetic.equipped
                                ? 'avatar equipped'
                                : `${cosmetic.type} owned`
                              : 'Owned cosmetic'}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-xl p-6">
                <Palette className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No cosmetics owned yet.
                </p>
              </div>
            )}
          </div>

          {/* Achievements (NEW COMPONENT) */}
          <UserAchievementsPreview username={user.username} />
        </div>
      </div>
    </main>
  )
}

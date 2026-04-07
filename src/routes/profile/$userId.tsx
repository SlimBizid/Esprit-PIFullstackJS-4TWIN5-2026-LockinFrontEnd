import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Github, Mail, Shield, Star, Palette, Pencil } from 'lucide-react'
import { api, useUser } from '@/stores/userStore'

interface UserProfile {
  id: string
  username: string
  githubHandle: string | null
  email: string
  type: 'admin' | 'player'
  createdAt: string
  updatedAt: string
  xp: number
  cosmetics?: string[]
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
  const totalXp = user.xp ?? null
  const isOwnProfile = currentUser?.username === user.username

  return (
    <main
      aria-labelledby="profile-heading"
      className="min-h-screen bg-background w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-32"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative corner */}
          <p
            aria-hidden="true"
            className="absolute top-4 right-4 font-mono text-xs text-primary/30 tracking-widest uppercase"
          ></p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar placeholder */}
            <div
              aria-hidden="true"
              className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0"
            >
              <span className="font-mono-one text-3xl text-primary uppercase">
                {user.username[0]}
              </span>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  id="profile-heading"
                  className="text-3xl md:text-4xl font-mono-one text-foreground uppercase tracking-tight"
                >
                  {user.username}
                </h1>

                {user.type === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest text-destructive uppercase bg-destructive/10 border border-destructive/20 px-2 py-1 rounded">
                    <Shield className="w-3 h-3" aria-hidden="true" />
                    Admin
                  </span>
                )}

                {isOwnProfile && (
                  <Link to="/profile/edit">
                    <button className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                      <Pencil className="w-3 h-3" aria-hidden="true" />
                      Edit Profile
                    </button>
                  </Link>
                )}
              </div>

              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Joined {joinedAt}
              </p>
            </div>

            {/* XP badge */}
            {totalXp !== null ? (
              <div
                aria-label={`Total XP: ${totalXp}`}
                className="flex flex-col items-center justify-center px-6 py-4 bg-background border border-primary/30 rounded-xl shadow-[0_0_20px_rgba(0,207,186,0.08)]"
              >
                <span className="text-2xl font-mono-one text-primary font-bold">
                  {totalXp.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  Total XP
                </span>
              </div>
            ) : (
              <div
                aria-label="XP not yet available"
                className="flex flex-col items-center justify-center px-6 py-4 bg-background border border-border rounded-xl opacity-40"
              >
                <Star
                  className="w-4 h-4 text-muted-foreground mb-1"
                  aria-hidden="true"
                />
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

        {/* Info + Cosmetics grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Account info */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-6">
              Account Info
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border">
                <Mail
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                    Email
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border">
                <Github
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
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
                <Shield
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
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
              <Link to="/cosmetics">
                <button className="text-[10px] font-bold tracking-widest text-primary uppercase hover:underline hover:cursor-pointer underline-offset-2 hover:opacity-80 transition-opacity">
                  See All
                </button>
              </Link>
            </div>

            {cosmetics.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3" role="list">
                {cosmetics.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 p-3 bg-background/50 rounded-xl border border-border text-sm text-foreground font-mono"
                  >
                    <Palette
                      className="w-4 h-4 text-primary flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div
                role="status"
                className="flex-1 flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-xl text-center p-6"
              >
                <Palette
                  className="w-6 h-6 text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  No cosmetics equipped yet.
                </p>
                <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
                  Earn them through ranked play
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer tag */}
        <div
          aria-hidden="true"
          className="flex justify-between items-center pt-2"
        >
          <span className="text-xs font-mono text-muted-foreground/30 uppercase tracking-widest">
            L-IN // PROFILE
          </span>
          <div className="w-8 h-px bg-primary/20" />
        </div>
      </div>
    </main>
  )
}

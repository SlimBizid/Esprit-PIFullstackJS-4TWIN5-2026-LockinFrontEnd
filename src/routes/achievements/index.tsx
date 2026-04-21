import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Trophy, Lock, Gift } from 'lucide-react'
import { api, useUser } from '@/stores/userStore'

interface Achievement {
  id: string
  name: string
  imageUrl: string | null
  unlocked: boolean
  unlockedAt: string | null
  rewards?: any[]
}

export const Route = createFileRoute('/achievements/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const user = useUser()

  useEffect(() => {
    if (!user?.username) return

    setLoading(true)
    setError(null)

    api
      .get(`/users/${user.username}/achievements`)
      .then((res) => setAchievements(res.data))
      .catch(() => setError('Failed to load achievements'))
      .finally(() => setLoading(false))
  }, [user?.username])

  if (!user?.username || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-primary animate-pulse uppercase tracking-widest text-sm">
          Loading achievements...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-destructive uppercase tracking-widest text-sm">
          {error}
        </p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-6 py-20 lg:px-32 relative">
      <div className="max-w-5xl mx-auto relative">
        {/* vertical path line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/10" />

        {/* header */}
        <div className="flex items-center gap-4 mb-16">
          <Trophy className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-mono-one uppercase tracking-tight text-foreground">
            Achievements
          </h1>
        </div>

        {/* path list */}
        <div className="space-y-16">
          {achievements.map((achievement, index) => {
            const unlocked = achievement.unlocked
            const rewardCount = achievement.rewards?.length ?? 0
            const isLeft = index % 2 === 0

            return (
              <div
                key={achievement.id}
                className="relative flex items-center w-full"
              >
                {/* CARD WRAPPER */}
                <div
                  className={`w-1/2 flex ${
                    isLeft ? 'justify-end pr-8' : 'justify-start pl-8 ml-auto'
                  }`}
                >
                  <div
                    className={`relative max-w-md border rounded-2xl p-5 transition-all duration-300 pt-10
                      ${
                        unlocked
                          ? 'bg-card border-primary/30 shadow-[0_0_20px_rgba(0,207,186,0.08)]'
                          : 'bg-card border-red-700/40 border-muted-foreground/40'
                      }`}
                  >
                    {/* STATUS BADGE */}
                    <div className="absolute top-3 right-3">
                      {unlocked ? (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-red-700 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      )}
                    </div>

                    {/* IMAGE */}
                    <div className="w-full h-28 mb-4 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden">
                      {achievement.imageUrl ? (
                        <img
                          src={achievement.imageUrl}
                          alt={achievement.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-primary/40" />
                      )}
                    </div>

                    {/* TEXT */}
                    <div className="space-y-2">
                      <h2 className="text-sm font-mono uppercase tracking-wide text-foreground">
                        {achievement.name}
                      </h2>

                      {rewardCount > 0 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <Gift className="w-3 h-3" />
                          {rewardCount} reward{rewardCount > 1 ? 's' : ''}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground font-mono italic">
                          No rewards
                        </p>
                      )}

                      {unlocked && achievement.unlockedAt && (
                        <p className="text-[10px] text-primary/70 font-mono uppercase tracking-widest">
                          Unlocked{' '}
                          {new Date(
                            achievement.unlockedAt,
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {!unlocked && (
                        <p className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-widest">
                          Not completed yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* CENTER NODE */}
                <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-primary/40 bg-background z-10" />
              </div>
            )
          })}
        </div>

        {/* footer */}
        <div className="mt-20 flex justify-between items-center">
          <span className="text-xs font-mono text-muted-foreground/30 uppercase tracking-widest">
            L-IN //
          </span>
          <div className="w-10 h-px bg-primary/20" />
        </div>
      </div>
    </main>
  )
}

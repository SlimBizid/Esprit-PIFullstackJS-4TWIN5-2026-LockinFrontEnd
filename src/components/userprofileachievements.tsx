import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { api } from '@/stores/userStore'

interface Achievement {
  id: string
  name: string
  imageUrl: string | null
  unlocked: boolean
  unlockedAt: string | null
}

export function UserAchievementsPreview({ username }: { username: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return

    setLoading(true)

    api
      .get(`/users/${username}/achievements`)
      .then((res) => {
        const unlocked = res.data.filter((a: Achievement) => a.unlocked)
        setAchievements(unlocked)
      })
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
          Loading achievements...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          Achievements ({achievements.length})
        </h2>

        <Link to="/achievements">
          <button className="p-2 text-[10px] font-bold tracking-widest text-primary uppercase hover:underline underline-offset-2 hover:opacity-80 transition-opacity">
            See All
          </button>
        </Link>
      </div>

      {achievements.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3">
          {achievements.slice(0, 6).map((ach) => (
            <li
              key={ach.id}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-background/50 rounded-xl border border-border text-center"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-background border border-border flex items-center justify-center">
                {ach.imageUrl ? (
                  <img
                    src={ach.imageUrl}
                    alt={ach.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Star className="w-5 h-5 text-primary/40" />
                )}
              </div>

              <span className="text-[10px] font-mono text-foreground uppercase tracking-wide">
                {ach.name}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-xl text-center p-6">
          <Star className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No achievements unlocked yet.
          </p>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Play to unlock rewards
          </p>
        </div>
      )}
    </div>
  )
}

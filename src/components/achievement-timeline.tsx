import { Lock, Gift, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Achievement } from '@/models/achievement'

type AchievementTimelineProps = {
  achievements: Achievement[]
  title: string
  eyebrow?: string
  description?: string
  action?: ReactNode
}

export function AchievementTimeline({
  achievements,
  title,
  eyebrow,
  description,
  action,
}: AchievementTimelineProps) {
  if (achievements.length === 0) {
    return (
      <main className="min-h-screen bg-background px-6 py-20 lg:px-32 relative">
        <div className="max-w-5xl mx-auto relative">
          {action ? <div className="mb-8">{action}</div> : null}

          <div className="mb-16 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                <Trophy className="h-6 w-6 text-primary" />
              </div>

              <div>
                {eyebrow ? (
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/70">
                    {eyebrow}
                  </p>
                ) : null}

                <h1 className="text-3xl font-mono-one uppercase tracking-tight text-foreground">
                  {title}
                </h1>
              </div>
            </div>

            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="border border-dashed border-primary/20 bg-card/40 px-6 py-16 text-center backdrop-blur-md">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground">
              No achievements yet
            </p>
          </div>

          <div className="mt-20 flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground/30 uppercase tracking-widest">
              L-IN //
            </span>
            <div className="h-px w-10 bg-primary/20" />
          </div>
        </div>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-background px-6 py-20 lg:px-32 relative">
      <div className="max-w-5xl mx-auto relative">
        {action ? <div className="mb-8">{action}</div> : null}

        <div className="absolute left-1/2 top-40 bottom-0 hidden w-px bg-primary/10 md:block" />

        <div className="mb-16 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              {eyebrow ? (
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-3xl font-mono-one uppercase tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          </div>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {achievements.length === 0 ? (
          <div className="border border-dashed border-primary/20 bg-card/40 px-6 py-16 text-center">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground">
              No achievements yet
            </p>
          </div>
        ) : (
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
                  <div
                    className={`w-full md:w-1/2 flex ${
                      isLeft
                        ? 'md:justify-end md:pr-8'
                        : 'md:justify-start md:pl-8 md:ml-auto'
                    }`}
                  >
                    <div
                      className={`relative w-full max-w-md border p-5 pt-10 ${
                        unlocked
                          ? 'bg-card border-primary/30 shadow-[0_0_20px_rgba(0,207,186,0.08)]'
                          : 'bg-card border-red-700/40 border-muted-foreground/40'
                      }`}
                    >
                      <div className="absolute top-3 right-3">
                        {unlocked ? (
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                            Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-red-700">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        )}
                      </div>

                      <div className="mb-4 flex h-28 w-full items-center justify-center overflow-hidden border border-border bg-background">
                        {achievement.imageUrl ? (
                          <img
                            src={achievement.imageUrl}
                            alt={achievement.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Trophy className="h-8 w-8 text-primary/40" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-mono uppercase tracking-wide text-foreground">
                          {achievement.name}
                        </h2>

                        <p className="text-xs leading-5 text-muted-foreground">
                          {achievement.description}
                        </p>

                        {rewardCount > 0 ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <Gift className="h-3 w-3" />
                            {rewardCount} reward{rewardCount > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground font-mono italic">
                            No rewards
                          </p>
                        )}

                        {unlocked && achievement.unlockedAt ? (
                          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70">
                            Unlocked{' '}
                            {new Date(
                              achievement.unlockedAt,
                            ).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                            Not completed yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 hidden h-3 w-3 -translate-x-1/2 rounded-full border border-primary/40 bg-background z-10 md:block" />
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-20 flex justify-between items-center">
          <span className="text-xs font-mono text-muted-foreground/30 uppercase tracking-widest">
            L-IN //
          </span>
          <div className="h-px w-10 bg-primary/20" />
        </div>
      </div>
    </main>
  )
}

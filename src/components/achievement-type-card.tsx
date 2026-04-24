import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  ACHIEVEMENT_TYPE_BLURBS,
  achievementTypeToSlug,
  type Achievement,
  type AchievementType,
} from '@/models/achievement'

type AchievementTypeCardProps = {
  achievements: Achievement[]
  index: number
  type: AchievementType
}

function getBackground(index: number) {
  if (index % 3 === 0) return 'rgba(7, 189, 101, 0.16)'
  if (index % 3 === 1) return 'rgba(248,113,113,0.16)'
  return 'rgba(250,204,21,0.16)'
}

export function AchievementTypeCard({
  achievements,
  index,
  type,
}: AchievementTypeCardProps) {
  const achievementsForType = achievements.filter(
    (achievement) => achievement.type === type,
  )
  const unlockedCount = achievementsForType.filter(
    (achievement) => achievement.unlocked,
  ).length

  return (
    <Link
      to="/achievements/$type"
      params={{ type: achievementTypeToSlug(type) }}
      className="group relative overflow-hidden border border-border/60 bg-card/80 p-6 transition-colors duration-300 hover:border-primary/35 hover:shadow-[0_22px_60px_rgba(0,0,0,0.25)]"
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: getBackground(index) }}
      />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              {unlockedCount}/{achievementsForType.length} unlocked
            </Badge>
            <h2 className="text-xl font-black leading-tight text-foreground">
              {type}
            </h2>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {ACHIEVEMENT_TYPE_BLURBS[type]}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-muted-foreground">
            <span>Unlocked</span>
            <span>
              {unlockedCount}/{achievementsForType.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width:
                  achievementsForType.length === 0
                    ? '0%'
                    : `${(unlockedCount / achievementsForType.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

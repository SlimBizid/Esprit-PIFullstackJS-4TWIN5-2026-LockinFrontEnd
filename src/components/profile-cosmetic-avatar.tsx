import type { ReactNode } from 'react'
import { UserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

type ProfileCosmeticAvatarProps = {
  avatarUrl?: string | null
  borderUrl?: string | null
  username: string
  className?: string
  frameClassName?: string
  imageClassName?: string
  fallback?: ReactNode
}

export function ProfileCosmeticAvatar({
  avatarUrl,
  borderUrl,
  username,
  className,
  frameClassName,
  imageClassName,
  fallback,
}: ProfileCosmeticAvatarProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border border-primary/30 bg-background/70 shadow-[0_0_20px_rgba(0,207,186,0.08)] flex-shrink-0',
        frameClassName ?? 'rounded-full',
        className,
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${username} equipped avatar`}
          className={cn('h-full w-full object-cover', imageClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-background/80">
          {fallback ?? (
            <UserRound className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
      )}

      {borderUrl ? (
        <img
          src={borderUrl}
          alt={`${username} equipped border`}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
        />
      ) : null}
    </div>
  )
}

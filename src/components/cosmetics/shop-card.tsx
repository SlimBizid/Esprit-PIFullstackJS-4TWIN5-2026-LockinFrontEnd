import { Link } from '@tanstack/react-router'
import { ArrowRight, ImageOff, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RARITY_STYLES, TYPE_STYLES } from '@/components/cosmetics/constants'
import { formatPrice } from '@/components/cosmetics/utils'
import { cn } from '@/lib/utils'
import { COSMETIC_TYPE_LABELS, type Cosmetic } from '@/models/cosmetic'

type ShopCardProps = {
  cosmetic: Cosmetic
  isAdmin: boolean
  onDelete: (cosmetic: Cosmetic) => void
  onEdit: (cosmetic: Cosmetic) => void
}

export function ShopCard({
  cosmetic,
  isAdmin,
  onDelete,
  onEdit,
}: ShopCardProps) {
  const [imageError, setImageError] = useState(false)
  const rarity = RARITY_STYLES[cosmetic.cosmeticRarity]
  const typeStyle = TYPE_STYLES[cosmetic.cosmeticType]

  return (
    <Link
      to="/cosmetic/$id"
      params={{ id: cosmetic.id }}
      className={cn(
        'group relative overflow-hidden rounded-[1.6rem] border bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(8,12,22,0.98))] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(0,0,0,0.34)]',
        rarity.card,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%,rgba(0,0,0,0.24))]" />
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-56 bg-gradient-to-b opacity-90 transition-opacity duration-300 group-hover:opacity-100',
          rarity.glow,
        )}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,13,0.82))]" />

      {isAdmin ? (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm"
            onClick={(event) => {
              event.preventDefault()
              onEdit(cosmetic)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-full"
            onClick={(event) => {
              event.preventDefault()
              onDelete(cosmetic)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="relative flex h-full flex-col p-4">
        <div
          className={cn(
            'mb-4 flex items-start justify-between gap-3',
            isAdmin && 'pr-20',
          )}
        >
          <Badge className={cn('rounded-full px-3 py-1 text-[11px]', rarity.badge)}>
            {rarity.label}
          </Badge>
          <Badge
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] capitalize',
              typeStyle.panel,
            )}
          >
            {COSMETIC_TYPE_LABELS[cosmetic.cosmeticType]}
          </Badge>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(4,10,8,0.92),rgba(8,16,12,0.98))]">
          <div
            className={cn(
              'absolute inset-x-0 top-0 h-20 bg-gradient-to-b opacity-80',
              typeStyle.tint,
            )}
          />
          <div
            className={cn(
              'absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl',
              rarity.spotlight,
            )}
          />
          {imageError ? (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-10 w-10 text-muted-foreground/40" />
            </div>
          ) : (
            <div className="h-full w-full">
              <img
                src={cosmetic.imageUrl}
                alt={cosmetic.cosmeticTitle}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-black leading-tight text-foreground">
                  {cosmetic.cosmeticTitle}
                </h2>
              </div>
              <div className="border border-border/70 bg-background/45 px-3 py-2 text-sm font-semibold whitespace-nowrap text-foreground">
                {formatPrice(cosmetic.price)}
              </div>
            </div>

            <p className="min-h-12 text-sm leading-6 text-muted-foreground">
              {cosmetic.cosmeticDescription}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
            <div className="text-[11px] uppercase tracking-[0.26em] text-emerald-300">
              View item
            </div>
            <ArrowRight className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}

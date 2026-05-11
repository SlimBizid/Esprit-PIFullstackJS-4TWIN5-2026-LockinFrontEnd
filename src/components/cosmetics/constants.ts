import type { CosmeticRarity, CosmeticType } from '@/models/cosmetic'

export const RARITY_STYLES: Record<
  CosmeticRarity,
  {
    badge: string
    card: string
    glow: string
    label: string
    spotlight: string
  }
> = {
  common: {
    badge: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
    card: 'border-slate-500/15',
    glow: 'from-slate-400/16 via-slate-400/4 to-transparent',
    label: 'Common',
    spotlight: 'bg-slate-300/10',
  },
  rare: {
    badge: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
    card: 'border-sky-500/20',
    glow: 'from-sky-400/18 via-cyan-400/6 to-transparent',
    label: 'Rare',
    spotlight: 'bg-sky-300/12',
  },
  epic: {
    badge: 'border-pink-500/25 bg-pink-500/10 text-pink-300',
    card: 'border-pink-500/20',
    glow: 'from-pink-400/18 via-rose-400/8 to-transparent',
    label: 'Epic',
    spotlight: 'bg-pink-300/12',
  },
  legendary: {
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    card: 'border-amber-500/30',
    glow: 'from-amber-300/24 via-yellow-300/10 to-transparent',
    label: 'Legendary',
    spotlight: 'bg-amber-200/14',
  },
}

export const TYPE_STYLES: Record<
  CosmeticType,
  { panel: string; tint: string }
> = {
  avatar: {
    panel: 'border-cyan-500/20 bg-cyan-500/8 text-cyan-200',
    tint: 'from-cyan-400/20 to-transparent',
  },
  banner: {
    panel: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-200',
    tint: 'from-emerald-400/20 to-transparent',
  },
  border: {
    panel: 'border-amber-500/20 bg-amber-500/8 text-amber-200',
    tint: 'from-amber-400/20 to-transparent',
  },
  emote: {
    panel: 'border-rose-500/20 bg-rose-500/8 text-rose-200',
    tint: 'from-rose-400/20 to-transparent',
  },
  skin: {
    panel: 'border-violet-500/20 bg-violet-500/8 text-violet-200',
    tint: 'from-violet-400/20 to-transparent',
  },
}

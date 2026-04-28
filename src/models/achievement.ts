export type AchievementType =
  | 'Tutorial'
  | 'General Challenges'
  | 'Coders Vs Imposters'
  | 'Teams'
  | 'CSS Battles'
  | 'Account'

export type AchievementReward = {
  id: string
  cosmeticTitle?: string
}

export type AchievementChallenge = {
  id: number
  title: string
  type: string
  difficulty: string
}

export type Achievement = {
  id: string
  name: string
  description: string
  type: AchievementType
  imageUrl: string | null
  createdAt: string
  unlocked: boolean
  unlockedAt: string | null
  rewards?: AchievementReward[]
  challenges?: AchievementChallenge[]
}

export function achievementTypeToSlug(type: AchievementType) {
  return type.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function slugToAchievementType(
  slug: string,
  types: AchievementType[],
): AchievementType | null {
  return (
    types.find((type) => achievementTypeToSlug(type) === slug.toLowerCase()) ??
    null
  )
}

export const ACHIEVEMENT_TYPE_BLURBS: Record<AchievementType, string> = {
  Tutorial: 'First steps, onboarding wins, and the early momentum markers.',
  'General Challenges':
    'Milestones earned across the core challenge ladder and daily grind.',
  'Coders Vs Imposters':
    'Social deduction feats, clutch reads, and sneaky lobby victories.',
  Teams: 'Crew-based progress, collaboration streaks, and shared conquest.',
  'CSS Battles':
    'Precision layout flexes, pixel-perfect duels, and design skill checks.',
  Account:
    'Profile, consistency, and account-level progression worth showing off.',
}

import type { CosmeticRarity, CosmeticType } from '@/models/cosmetic'

export type AchievementOption = {
  id: string
  name: string
  type: string
}

export type CosmeticFormState = {
  imageUrl: string
  cosmeticTitle: string
  cosmeticDescription: string
  cosmeticRarity: CosmeticRarity
  cosmeticType: CosmeticType
  achievementId: string
  price: string
}

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type CosmeticType = 'skin' | 'emote' | 'avatar' | 'banner'

export type Cosmetic = {
  id: string
  imageUrl: string
  cosmeticTitle: string
  cosmeticDescription: string
  cosmeticRarity: CosmeticRarity
  achievementId: string | null
  cosmeticType: CosmeticType
  createdAt: string
  updatedAt: string
}

export type PaginatedCosmetics = {
  data: Cosmetic[]
  total: number
  page: number
  lastPage: number
}

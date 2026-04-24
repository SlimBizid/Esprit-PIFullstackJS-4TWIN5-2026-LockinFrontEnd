export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type CosmeticType = 'skin' | 'emote' | 'avatar' | 'banner'

export const COSMETIC_TYPES: CosmeticType[] = [
  'skin',
  'emote',
  'avatar',
  'banner',
]

export const COSMETIC_RARITIES: CosmeticRarity[] = [
  'common',
  'rare',
  'epic',
  'legendary',
]

export const COSMETIC_TYPE_LABELS: Record<CosmeticType, string> = {
  skin: 'Skin',
  emote: 'Emote',
  avatar: 'Avatar',
  banner: 'Banner',
}

export type Cosmetic = {
  id: string
  imageUrl: string
  cosmeticTitle: string
  cosmeticDescription: string
  cosmeticRarity: CosmeticRarity
  price: number | null
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

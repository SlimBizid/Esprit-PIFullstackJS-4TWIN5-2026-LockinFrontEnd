import { describe, expect, it } from 'vitest'

import { filterShopCosmetics, formatPrice } from '@/components/cosmetics/utils'
import type { Cosmetic } from '@/models/cosmetic'

const cosmetics: Cosmetic[] = [
  {
    id: '1',
    imageUrl: '/avatar.png',
    cosmeticTitle: 'Sky Scout',
    cosmeticDescription: 'Blue avatar frame',
    cosmeticRarity: 'rare',
    price: 1200,
    achievementId: null,
    cosmeticType: 'avatar',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: '2',
    imageUrl: '/skin.png',
    cosmeticTitle: 'Inferno Suit',
    cosmeticDescription: 'Legendary skin for duel mode',
    cosmeticRarity: 'legendary',
    price: null,
    achievementId: 'ach-1',
    cosmeticType: 'skin',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: '3',
    imageUrl: '/banner.png',
    cosmeticTitle: 'Forest Banner',
    cosmeticDescription: 'Quiet green vibes',
    cosmeticRarity: 'common',
    price: 300,
    achievementId: null,
    cosmeticType: 'banner',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('formatPrice', () => {
  it('formats priced cosmetics with locale separators', () => {
    expect(formatPrice(1200)).toMatch(/^1(?:[\s,.\u202f])?200 coins$/u)
  })

  it('marks missing prices as reward only', () => {
    expect(formatPrice(null)).toBe('Reward only')
  })
})

describe('filterShopCosmetics', () => {
  it('returns all cosmetics when every filter is open', () => {
    expect(filterShopCosmetics(cosmetics, 'all', 'all', '')).toEqual(cosmetics)
  })

  it('filters by cosmetic type', () => {
    expect(filterShopCosmetics(cosmetics, 'skin', 'all', '')).toEqual([
      cosmetics[1],
    ])
  })

  it('filters by rarity', () => {
    expect(filterShopCosmetics(cosmetics, 'all', 'common', '')).toEqual([
      cosmetics[2],
    ])
  })

  it('matches trimmed case-insensitive search across text fields', () => {
    expect(
      filterShopCosmetics(cosmetics, 'all', 'all', '  duel MODE  '),
    ).toEqual([cosmetics[1]])
  })

  it('combines type, rarity, and search filters', () => {
    expect(filterShopCosmetics(cosmetics, 'avatar', 'rare', 'blue')).toEqual([
      cosmetics[0],
    ])
  })
})

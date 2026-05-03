import { describe, expect, it } from 'vitest'

import { filterShopCosmetics, formatPrice } from './utils'

const cosmetics = [
  {
    id: '1',
    imageUrl: 'https://example.com/1.png',
    cosmeticTitle: 'Golden Banner',
    cosmeticDescription: 'A bright banner for winners.',
    cosmeticRarity: 'legendary',
    price: 1000,
    achievementId: null,
    cosmeticType: 'banner',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: '2',
    imageUrl: 'https://example.com/2.png',
    cosmeticTitle: 'Wave Emote',
    cosmeticDescription: 'Say hello to the lobby.',
    cosmeticRarity: 'common',
    price: null,
    achievementId: 'ach-22',
    cosmeticType: 'emote',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
] as const

describe('shop cosmetic utils', () => {
  it('formats reward-only and coin prices', () => {
    expect(formatPrice(null)).toBe('Reward only')
    expect(formatPrice(1500)).toBe('1,500 coins')
  })

  it('filters cosmetics by type, rarity, and text query', () => {
    expect(filterShopCosmetics([...cosmetics], 'banner', 'all', '')).toEqual([
      cosmetics[0],
    ])

    expect(filterShopCosmetics([...cosmetics], 'all', 'common', 'hello')).toEqual([
      cosmetics[1],
    ])

    expect(filterShopCosmetics([...cosmetics], 'all', 'epic', '')).toEqual([])
  })
})

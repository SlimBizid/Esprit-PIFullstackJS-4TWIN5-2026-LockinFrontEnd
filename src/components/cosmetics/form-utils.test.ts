import { describe, expect, it } from 'vitest'

import { buildCosmeticPayload, cosmeticToForm, validateCosmeticForm } from './form-utils'

describe('cosmetic form utils', () => {
  it('maps a cosmetic into form state strings', () => {
    expect(
      cosmeticToForm({
        id: 'c1',
        imageUrl: 'https://example.com/item.png',
        cosmeticTitle: 'Victory Banner',
        cosmeticDescription: 'Celebrate the win.',
        cosmeticRarity: 'epic',
        price: 250,
        achievementId: null,
        cosmeticType: 'banner',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      }),
    ).toEqual({
      imageUrl: 'https://example.com/item.png',
      cosmeticTitle: 'Victory Banner',
      cosmeticDescription: 'Celebrate the win.',
      cosmeticRarity: 'epic',
      cosmeticType: 'banner',
      achievementId: '',
      price: '250',
    })
  })

  it('validates required fields and integer-only prices', () => {
    expect(
      validateCosmeticForm({
        imageUrl: ' ',
        cosmeticTitle: 'Test',
        cosmeticDescription: 'Desc',
        cosmeticRarity: 'common',
        cosmeticType: 'avatar',
        achievementId: '',
        price: '',
      }),
    ).toBe('Image URL is required.')

    expect(
      validateCosmeticForm({
        imageUrl: 'https://example.com/item.png',
        cosmeticTitle: 'Test',
        cosmeticDescription: 'Desc',
        cosmeticRarity: 'common',
        cosmeticType: 'avatar',
        achievementId: '',
        price: '19.5',
      }),
    ).toBe('Price must be a non-negative whole number.')
  })

  it('rejects achievement-linked cosmetics with a price and trims payload values', () => {
    expect(
      validateCosmeticForm({
        imageUrl: 'https://example.com/item.png',
        cosmeticTitle: 'Title',
        cosmeticDescription: 'Desc',
        cosmeticRarity: 'legendary',
        cosmeticType: 'skin',
        achievementId: 'ach-1',
        price: '100',
      }),
    ).toBe('A cosmetic linked to an achievement cannot have a price.')

    expect(
      buildCosmeticPayload({
        imageUrl: ' https://example.com/item.png ',
        cosmeticTitle: ' Winner Frame ',
        cosmeticDescription: ' Fancy border ',
        cosmeticRarity: 'rare',
        cosmeticType: 'banner',
        achievementId: ' ach-2 ',
        price: ' 300 ',
      }),
    ).toEqual({
      imageUrl: 'https://example.com/item.png',
      cosmeticTitle: 'Winner Frame',
      cosmeticDescription: 'Fancy border',
      cosmeticRarity: 'rare',
      cosmeticType: 'banner',
      achievementId: 'ach-2',
      price: 300,
    })
  })
})

import { describe, expect, it } from 'vitest'

import {
  buildCosmeticPayload,
  cosmeticToForm,
  DEFAULT_FORM,
  validateCosmeticForm,
} from '@/components/cosmetics/form-utils'
import type { Cosmetic } from '@/models/cosmetic'

const cosmetic: Cosmetic = {
  id: '1',
  imageUrl: ' https://example.com/skin.png ',
  cosmeticTitle: 'Inferno Suit',
  cosmeticDescription: 'Legendary skin',
  cosmeticRarity: 'legendary',
  price: 5000,
  achievementId: 'achievement-1',
  cosmeticType: 'skin',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('DEFAULT_FORM', () => {
  it('starts with expected empty defaults', () => {
    expect(DEFAULT_FORM).toEqual({
      imageUrl: '',
      cosmeticTitle: '',
      cosmeticDescription: '',
      cosmeticRarity: 'common',
      cosmeticType: 'avatar',
      achievementId: '',
      price: '',
    })
  })
})

describe('cosmeticToForm', () => {
  it('converts a cosmetic entity into editable form state', () => {
    expect(cosmeticToForm(cosmetic)).toEqual({
      imageUrl: ' https://example.com/skin.png ',
      cosmeticTitle: 'Inferno Suit',
      cosmeticDescription: 'Legendary skin',
      cosmeticRarity: 'legendary',
      cosmeticType: 'skin',
      achievementId: 'achievement-1',
      price: '5000',
    })
  })
})

describe('validateCosmeticForm', () => {
  it('requires an image url', () => {
    expect(validateCosmeticForm({ ...DEFAULT_FORM })).toBe(
      'Image URL is required.',
    )
  })

  it('requires a title after the image url is filled', () => {
    expect(
      validateCosmeticForm({ ...DEFAULT_FORM, imageUrl: 'https://example.com' }),
    ).toBe('Title is required.')
  })

  it('requires a description after title is filled', () => {
    expect(
      validateCosmeticForm({
        ...DEFAULT_FORM,
        imageUrl: 'https://example.com',
        cosmeticTitle: 'Title',
      }),
    ).toBe('Description is required.')
  })

  it('rejects non-integer negative, and NaN prices', () => {
    expect(
      validateCosmeticForm({
        ...DEFAULT_FORM,
        imageUrl: 'https://example.com',
        cosmeticTitle: 'Title',
        cosmeticDescription: 'Desc',
        price: '-1',
      }),
    ).toBe('Price must be a non-negative whole number.')

    expect(
      validateCosmeticForm({
        ...DEFAULT_FORM,
        imageUrl: 'https://example.com',
        cosmeticTitle: 'Title',
        cosmeticDescription: 'Desc',
        price: '4.2',
      }),
    ).toBe('Price must be a non-negative whole number.')
  })

  it('rejects forms that set both achievement and price', () => {
    expect(
      validateCosmeticForm({
        ...DEFAULT_FORM,
        imageUrl: 'https://example.com',
        cosmeticTitle: 'Title',
        cosmeticDescription: 'Desc',
        achievementId: 'ach-1',
        price: '100',
      }),
    ).toBe('A cosmetic linked to an achievement cannot have a price.')
  })

  it('accepts a valid reward-only form', () => {
    expect(
      validateCosmeticForm({
        ...DEFAULT_FORM,
        imageUrl: 'https://example.com',
        cosmeticTitle: 'Title',
        cosmeticDescription: 'Desc',
        achievementId: 'ach-1',
      }),
    ).toBeNull()
  })
})

describe('buildCosmeticPayload', () => {
  it('trims text fields and parses numeric price', () => {
    expect(
      buildCosmeticPayload({
        imageUrl: ' https://example.com/item.png ',
        cosmeticTitle: ' Trophy ',
        cosmeticDescription: ' Rare banner ',
        cosmeticRarity: 'rare',
        cosmeticType: 'banner',
        achievementId: ' ach-2 ',
        price: ' 700 ',
      }),
    ).toEqual({
      imageUrl: 'https://example.com/item.png',
      cosmeticTitle: 'Trophy',
      cosmeticDescription: 'Rare banner',
      cosmeticRarity: 'rare',
      cosmeticType: 'banner',
      achievementId: 'ach-2',
      price: 700,
    })
  })

  it('normalizes empty achievement ids and prices to null', () => {
    expect(
      buildCosmeticPayload({
        ...DEFAULT_FORM,
        imageUrl: ' https://example.com/item.png ',
        cosmeticTitle: ' Name ',
        cosmeticDescription: ' Desc ',
      }),
    ).toEqual({
      imageUrl: 'https://example.com/item.png',
      cosmeticTitle: 'Name',
      cosmeticDescription: 'Desc',
      cosmeticRarity: 'common',
      cosmeticType: 'avatar',
      achievementId: null,
      price: null,
    })
  })
})

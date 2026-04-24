import type { Cosmetic } from '@/models/cosmetic'
import type { CosmeticFormState } from '@/models/cosmetics-shop'

export const DEFAULT_FORM: CosmeticFormState = {
  imageUrl: '',
  cosmeticTitle: '',
  cosmeticDescription: '',
  cosmeticRarity: 'common',
  cosmeticType: 'avatar',
  achievementId: '',
  price: '',
}

export function cosmeticToForm(cosmetic: Cosmetic): CosmeticFormState {
  return {
    imageUrl: cosmetic.imageUrl,
    cosmeticTitle: cosmetic.cosmeticTitle,
    cosmeticDescription: cosmetic.cosmeticDescription,
    cosmeticRarity: cosmetic.cosmeticRarity,
    cosmeticType: cosmetic.cosmeticType,
    achievementId: cosmetic.achievementId ?? '',
    price: cosmetic.price?.toString() ?? '',
  }
}

export function validateCosmeticForm(form: CosmeticFormState): string | null {
  if (!form.imageUrl.trim()) return 'Image URL is required.'
  if (!form.cosmeticTitle.trim()) return 'Title is required.'
  if (!form.cosmeticDescription.trim()) return 'Description is required.'

  if (form.price.trim()) {
    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
      return 'Price must be a non-negative whole number.'
    }
  }

  if (form.achievementId.trim() && form.price.trim()) {
    return 'A cosmetic linked to an achievement cannot have a price.'
  }

  return null
}

export function buildCosmeticPayload(form: CosmeticFormState) {
  return {
    imageUrl: form.imageUrl.trim(),
    cosmeticTitle: form.cosmeticTitle.trim(),
    cosmeticDescription: form.cosmeticDescription.trim(),
    cosmeticRarity: form.cosmeticRarity,
    cosmeticType: form.cosmeticType,
    achievementId: form.achievementId.trim() || null,
    price: form.price.trim() ? Number(form.price.trim()) : null,
  }
}

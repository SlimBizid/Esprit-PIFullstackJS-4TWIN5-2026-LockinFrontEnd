import type { Cosmetic, CosmeticType } from '@/models/cosmetic'

export type EquippedCosmeticRecord = {
  id?: string
  imageUrl?: string
  cosmeticTitle?: string
  cosmeticType?: CosmeticType
  type?: CosmeticType
  equipped?: boolean
}

export type CosmeticOwnerProfile = {
  cosmetics?: Array<string | Partial<Cosmetic> | EquippedCosmeticRecord>
}

export function isEquippedCosmeticRecord(
  value: unknown,
): value is EquippedCosmeticRecord {
  return typeof value === 'object' && value !== null
}

export function getEquippedCosmetic(
  profile: CosmeticOwnerProfile,
  type: CosmeticType,
): EquippedCosmeticRecord | null {
  for (const cosmetic of profile.cosmetics ?? []) {
    if (
      isEquippedCosmeticRecord(cosmetic) &&
      cosmetic.equipped &&
      (cosmetic.cosmeticType === type || cosmetic.type === type)
    ) {
      return cosmetic
    }
  }

  return null
}

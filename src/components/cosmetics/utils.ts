import type {
  Cosmetic,
  CosmeticRarity,
  CosmeticType,
} from '@/models/cosmetic'

export function formatPrice(price: number | null) {
  if (price == null) return 'Reward only'
  return `${price.toLocaleString()} coins`
}

export function filterShopCosmetics(
  cosmetics: Cosmetic[],
  typeFilter: CosmeticType | 'all',
  rarityFilter: CosmeticRarity | 'all',
  searchQuery: string,
) {
  const search = searchQuery.trim().toLowerCase()

  return cosmetics.filter((cosmetic) => {
    if (typeFilter !== 'all' && cosmetic.cosmeticType !== typeFilter) {
      return false
    }

    if (rarityFilter !== 'all' && cosmetic.cosmeticRarity !== rarityFilter) {
      return false
    }

    if (
      search &&
      ![
        cosmetic.cosmeticTitle,
        cosmetic.cosmeticDescription,
        cosmetic.cosmeticType,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    ) {
      return false
    }

    return true
  })
}

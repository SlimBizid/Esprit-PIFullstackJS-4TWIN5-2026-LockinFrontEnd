import { describe, expect, it } from 'vitest'

import {
  RARITY_STYLES,
  TYPE_STYLES,
} from '@/components/cosmetics/constants'
import {
  COSMETIC_RARITIES,
  COSMETIC_TYPES,
  COSMETIC_TYPE_LABELS,
} from '@/models/cosmetic'
import { LANGUAGE_FILE_EXTENSIONS } from '@/models/language-file-extensions'
import { LANGUAGE_LABELS } from '@/models/lagnuage-labels'
import { UserType } from '@/models/user'

describe('reference data', () => {
  it('exposes the supported user types', () => {
    expect(UserType.ADMIN).toBe('admin')
    expect(UserType.PLAYER).toBe('player')
  })

  it('keeps cosmetic types, rarities, and labels in sync', () => {
    expect(COSMETIC_TYPES).toEqual(['skin', 'emote', 'avatar', 'banner'])
    expect(COSMETIC_RARITIES).toEqual(['common', 'rare', 'epic', 'legendary'])
    expect(COSMETIC_TYPE_LABELS).toEqual({
      skin: 'Skin',
      emote: 'Emote',
      avatar: 'Avatar',
      banner: 'Banner',
    })
  })

  it('maps editor languages to labels and file extensions', () => {
    expect(LANGUAGE_LABELS.typescript).toBe('TypeScript')
    expect(LANGUAGE_LABELS.cpp).toBe('C++')
    expect(LANGUAGE_FILE_EXTENSIONS.javascript).toBe('js')
    expect(LANGUAGE_FILE_EXTENSIONS.python).toBe('py')
  })

  it('defines rarity and type style presets for every supported cosmetic', () => {
    expect(RARITY_STYLES.legendary.label).toBe('Legendary')
    expect(RARITY_STYLES.common.badge).toContain('slate')
    expect(TYPE_STYLES.avatar.panel).toContain('cyan')
    expect(TYPE_STYLES.skin.tint).toContain('violet')
  })
})

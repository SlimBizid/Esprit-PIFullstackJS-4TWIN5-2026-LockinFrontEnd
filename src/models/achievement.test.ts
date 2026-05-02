import { describe, expect, it } from 'vitest'

import {
  ACHIEVEMENT_TYPE_BLURBS,
  achievementTypeToSlug,
  slugToAchievementType,
} from './achievement'

describe('achievement helpers', () => {
  it('converts achievement types to URL-safe slugs', () => {
    expect(achievementTypeToSlug('General Challenges')).toBe(
      'general-challenges',
    )
    expect(achievementTypeToSlug('Coders Vs Imposters')).toBe(
      'coders-vs-imposters',
    )
  })

  it('finds a type from a slug case-insensitively', () => {
    const types = Object.keys(ACHIEVEMENT_TYPE_BLURBS) as Array<
      keyof typeof ACHIEVEMENT_TYPE_BLURBS
    >

    expect(slugToAchievementType('CSS-BATTLES', types)).toBe('CSS Battles')
  })

  it('returns null when the slug does not match any type', () => {
    expect(slugToAchievementType('unknown-type', ['Tutorial', 'Teams'])).toBe(
      null,
    )
  })
})

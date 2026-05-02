import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('drops falsy values', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'visible')).toBe(
      'base visible',
    )
  })

  it('lets tailwind-merge resolve conflicting utilities', () => {
    expect(cn('px-2 text-sm', 'px-4', 'text-lg')).toBe('px-4 text-lg')
  })
})

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Seo } from '@/components/Seo'

function getMeta(attribute: 'name' | 'property', key: string) {
  return document.head.querySelector(`meta[${attribute}="${key}"]`)
}

describe('Seo', () => {
  it('writes title, meta tags, canonical url, and structured data', () => {
    render(
      <Seo
        title="Profile"
        description="View your LockIN profile"
        path="/profile"
        robots="noindex,nofollow"
      />,
    )

    expect(document.title).toBe('Profile | LockIN')
    expect(getMeta('name', 'description')?.getAttribute('content')).toBe(
      'View your LockIN profile',
    )
    expect(getMeta('name', 'robots')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    )
    expect(getMeta('property', 'og:url')?.getAttribute('content')).toBe(
      'http://localhost:3000/profile',
    )
    expect(
      document
        .head.querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    ).toBe('http://localhost:3000/profile')

    const script = document.head.querySelector(
      'script[data-seo-structured-data="true"]',
    )
    expect(script?.textContent).toContain('"@type":"WebPage"')
    expect(script?.textContent).toContain('"url":"http://localhost:3000/profile"')
  })

  it('updates existing tags instead of duplicating them', () => {
    const { rerender } = render(
      <Seo title="Home" description="Welcome" path="/" />,
    )

    rerender(
      <Seo title="Leaderboard" description="Top coders" path="/leaderboard" />,
    )

    expect(
      document.head.querySelectorAll('meta[name="description"]').length,
    ).toBe(1)
    expect(document.title).toBe('Leaderboard | LockIN')
    expect(getMeta('property', 'og:title')?.getAttribute('content')).toBe(
      'Leaderboard | LockIN',
    )
    expect(
      document.head.querySelectorAll('script[data-seo-structured-data="true"]')
        .length,
    ).toBe(1)
  })
})

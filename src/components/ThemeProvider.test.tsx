import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-themes', () => ({
  ThemeProvider: ({
    children,
    ...props
  }: {
    children: ReactNode
    attribute?: string
    defaultTheme?: string
  }) => (
    <div data-slot="mock-theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}))

import { ThemeProvider } from '@/components/ThemeProvider'

describe('ThemeProvider', () => {
  it('passes props through to next-themes provider and renders children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <span>content</span>
      </ThemeProvider>,
    )

    const provider = screen.getByText('content').parentElement
    expect(provider?.getAttribute('data-slot')).toBe('mock-theme-provider')
    expect(provider?.getAttribute('data-props')).toContain('"attribute":"class"')
    expect(provider?.getAttribute('data-props')).toContain(
      '"defaultTheme":"dark"',
    )
  })
})

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AuthShell } from '@/components/auth/AuthShell'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
  ...props
  }: {
    to: string
    children: ReactNode
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('AuthShell', () => {
  it('renders headings, children, and supporting stats', () => {
    render(
      <AuthShell heading="Welcome back" subheading="Sign in to continue">
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" />
        </form>
      </AuthShell>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome back' }),
    ).toBeTruthy()
    expect(screen.getByText('Sign in to continue')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByText('12k+')).toBeTruthy()
    expect(screen.getByText('98%')).toBeTruthy()
    expect(screen.getByText('4.9')).toBeTruthy()
  })

  it('renders the mobile home link with an accessible label', () => {
    render(
      <AuthShell heading="Create account" subheading="Join the arena">
        <div>content</div>
      </AuthShell>,
    )

    expect(screen.getByLabelText('Go to LockIN homepage').getAttribute('href')).toBe(
      '/',
    )
  })
})

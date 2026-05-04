import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((value: unknown) => value),
}))

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
  createFileRoute: () => () => ({}),
  redirect: redirectMock,
}))

import { UserType, type User } from '@/models/user'
import { UpdatePasswordPage } from '@/routes/profile/edit/password'
import { api, useUserStore } from '@/stores/userStore'

const sampleUser: User = {
  id: 'user-1',
  username: 'ram',
  githubHandle: '',
  email: 'ram@example.com',
  type: UserType.PLAYER,
  coins: 42,
  xp: 1200,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
}

function fillInput(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useUserStore.setState({
      user: sampleUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  })

  it('submits the password update form successfully', async () => {
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({
      data: { message: 'Password updated successfully' },
    } as never)

    render(<UpdatePasswordPage />)

    fillInput(/current password/i, 'currentpass123')
    fillInput(/^new password$/i, 'newpass123')
    fillInput(/confirm new password/i, 'newpass123')
    fireEvent.submit(screen.getByRole('form', { name: 'Update password form' }))

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/users/me/password', {
        currentPassword: 'currentpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      })
    })

    expect(screen.getByText('Password updated successfully')).toBeTruthy()
  })

  it('shows client-side validation for mismatched passwords', async () => {
    render(<UpdatePasswordPage />)

    fillInput(/current password/i, 'currentpass123')
    fillInput(/^new password$/i, 'newpass123')
    fillInput(/confirm new password/i, 'different123')
    fireEvent.submit(screen.getByRole('form', { name: 'Update password form' }))

    await waitFor(() => {
      expect(screen.getByText('New passwords do not match')).toBeTruthy()
    })
  })
})

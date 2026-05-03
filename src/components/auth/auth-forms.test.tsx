import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()

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
  useNavigate: () => navigateMock,
}))

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { api, useUserStore } from '@/stores/userStore'
import { UserType, type User } from '@/models/user'

const sampleUser: User = {
  id: 'user-1',
  username: 'ram',
  githubHandle: 'ramdev',
  email: 'ram@example.com',
  type: UserType.PLAYER,
  coins: 42,
  xp: 1200,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
}

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

function fillInput(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('auth forms', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  it('submits the login form successfully and stores the user', async () => {
    const setUserSpy = vi.spyOn(useUserStore.getState(), 'setUser')
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: sampleUser } as never)

    renderWithQuery(<LoginForm />)

    fillInput(/username/i, 'ram')
    fillInput(/password/i, 'secret')
    fireEvent.submit(screen.getByRole('form', { name: 'Sign in form' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'ram',
        password: 'secret',
      })
    })

    expect(setUserSpy).toHaveBeenCalledWith(sampleUser)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/' })
  })

  it('shows validation and backend error states in the login form', async () => {
    const error = new AxiosError('Login failed')
    vi.spyOn(api, 'post').mockRejectedValueOnce(error)

    renderWithQuery(<LoginForm />)

    fireEvent.submit(screen.getByRole('form', { name: 'Sign in form' }))
    await waitFor(() => {
      expect(screen.getByText('Please enter your username.')).toBeTruthy()
    })
    expect(screen.getByText('Please enter your password.')).toBeTruthy()

    fillInput(/username/i, 'ram')
    fillInput(/password/i, 'wrong')
    fireEvent.submit(screen.getByRole('form', { name: 'Sign in form' }))

    await waitFor(() => {
      expect(
        screen.getByText('Incorrect username or password. Please try again.'),
      ).toBeTruthy()
    })
  })

  it('submits registration, auto logs in, and redirects home', async () => {
    const setUserSpy = vi.spyOn(useUserStore.getState(), 'setUser')
    const postSpy = vi.spyOn(api, 'post')
    postSpy
      .mockResolvedValueOnce({ data: {} } as never)
      .mockResolvedValueOnce({ data: sampleUser } as never)

    renderWithQuery(<RegisterForm />)

    fillInput(/username/i, 'ram')
    fillInput(/email/i, 'ram@example.com')
    fillInput(/^password$/i, 'secret123')
    fillInput(/confirm password/i, 'secret123')
    fireEvent.submit(screen.getByRole('form', { name: 'Create account form' }))

    await waitFor(() => {
      expect(postSpy).toHaveBeenNthCalledWith(1, '/auth/signup', {
        username: 'ram',
        email: 'ram@example.com',
        password: 'secret123',
      })
    })

    expect(postSpy).toHaveBeenNthCalledWith(2, '/auth/login', {
      username: 'ram',
      password: 'secret123',
    })
    expect(setUserSpy).toHaveBeenCalledWith(sampleUser)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/' })
  })

  it('shows register validation and backend array errors', async () => {
    const error = new AxiosError('Registration failed')
    error.response = {
      data: { message: ['Email already used', 'Username taken'] },
    } as never
    vi.spyOn(api, 'post').mockRejectedValueOnce(error)

    renderWithQuery(<RegisterForm />)

    fillInput(/username/i, 'ra')
    fillInput(/email/i, 'bad-email')
    fillInput(/^password$/i, '123')
    fillInput(/confirm password/i, '456')
    fireEvent.submit(screen.getByRole('form', { name: 'Create account form' }))

    await waitFor(() => {
      expect(
        screen.getByText('Username must be at least 3 characters.'),
      ).toBeTruthy()
    })
    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy()
    expect(screen.getByText('At least 8 characters required.')).toBeTruthy()
    expect(screen.getByText('Passwords do not match.')).toBeTruthy()

    fillInput(/username/i, 'ramdev')
    fillInput(/email/i, 'ram@example.com')
    fillInput(/^password$/i, 'secret123')
    fillInput(/confirm password/i, 'secret123')
    fireEvent.submit(screen.getByRole('form', { name: 'Create account form' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'Email already used, Username taken',
      )
    })
  })

  it('redirects to login when register auto-login fails', async () => {
    const postSpy = vi.spyOn(api, 'post')
    postSpy
      .mockResolvedValueOnce({ data: {} } as never)
      .mockRejectedValueOnce(new Error('auto login failed'))

    renderWithQuery(<RegisterForm />)

    fillInput(/username/i, 'ram')
    fillInput(/email/i, 'ram@example.com')
    fillInput(/^password$/i, 'secret123')
    fillInput(/confirm password/i, 'secret123')
    fireEvent.submit(screen.getByRole('form', { name: 'Create account form' }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/auth/login' })
    })
  })

  it('submits forgot password and renders the success state', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({} as never)

    renderWithQuery(<ForgotPasswordForm />)

    fillInput(/email address/i, 'ram@example.com')
    fireEvent.submit(screen.getByRole('form', { name: 'Forgot password form' }))

    await waitFor(() => {
      expect(screen.getByText('Check your inbox')).toBeTruthy()
    })

    expect(screen.getByText('ram@example.com')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Back to sign in/i })).toBeTruthy()
  })

  it('shows forgot password validation and error state', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('boom'))

    renderWithQuery(<ForgotPasswordForm />)

    fireEvent.submit(screen.getByRole('form', { name: 'Forgot password form' }))
    await waitFor(() => {
      expect(
        screen.getByText('Please enter your email address.'),
      ).toBeTruthy()
    })

    fillInput(/email address/i, 'broken')
    fireEvent.submit(screen.getByRole('form', { name: 'Forgot password form' }))
    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address.'),
      ).toBeTruthy()
    })

    fillInput(/email address/i, 'ram@example.com')
    fireEvent.submit(screen.getByRole('form', { name: 'Forgot password form' }))

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again in a moment.'),
      ).toBeTruthy()
    })
  })
})

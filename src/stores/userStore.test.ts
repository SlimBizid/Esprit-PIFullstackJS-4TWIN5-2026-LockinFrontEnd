import axios, { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api, initializeAuth, useUserStore } from '@/stores/userStore'
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

function resetUserStore() {
  useUserStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })
}

describe('useUserStore', () => {
  beforeEach(() => {
    resetUserStore()
  })

  it('sets and clears the user synchronously', () => {
    useUserStore.getState().setUser(sampleUser)
    expect(useUserStore.getState().user).toEqual(sampleUser)
    expect(useUserStore.getState().isAuthenticated).toBe(true)

    useUserStore.getState().clearUser()
    expect(useUserStore.getState().user).toBeNull()
    expect(useUserStore.getState().isAuthenticated).toBe(false)
  })

  it('logs in successfully and stores the returned user', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: sampleUser } as never)

    await useUserStore
      .getState()
      .login({ email: 'ram@example.com', password: 'secret' })

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'ram@example.com',
      password: 'secret',
    })
    expect(useUserStore.getState().user).toEqual(sampleUser)
    expect(useUserStore.getState().isAuthenticated).toBe(true)
    expect(useUserStore.getState().error).toBeNull()
  })

  it('stores backend login errors and rethrows them', async () => {
    const error = new AxiosError('Login failed')
    error.response = {
      data: { message: 'Invalid credentials' },
    } as never
    vi.spyOn(api, 'post').mockRejectedValueOnce(error)

    await expect(
      useUserStore
        .getState()
        .login({ email: 'ram@example.com', password: 'wrong' }),
    ).rejects.toBe(error)

    expect(useUserStore.getState().error).toBe('Invalid credentials')
    expect(useUserStore.getState().isLoading).toBe(false)
  })

  it('logs out even if the request fails', async () => {
    useUserStore.setState({
      user: sampleUser,
      isAuthenticated: true,
      isLoading: false,
      error: 'old',
    })
    const error = new Error('network')
    vi.spyOn(api, 'post').mockRejectedValueOnce(error)

    await expect(useUserStore.getState().logout()).rejects.toBe(error)

    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    expect(useUserStore.getState().user).toBeNull()
    expect(useUserStore.getState().isAuthenticated).toBe(false)
    expect(useUserStore.getState().error).toBeNull()
  })

  it('fetches the current user successfully', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: sampleUser } as never)

    await useUserStore.getState().fetchMe()

    expect(api.get).toHaveBeenCalledWith('/users/me')
    expect(useUserStore.getState().user).toEqual(sampleUser)
    expect(useUserStore.getState().isAuthenticated).toBe(true)
  })

  it('clears auth state when fetchMe fails', async () => {
    useUserStore.setState({
      user: sampleUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
    vi.spyOn(api, 'get').mockRejectedValueOnce(new AxiosError('Unauthorized'))

    await useUserStore.getState().fetchMe()

    expect(useUserStore.getState().user).toBeNull()
    expect(useUserStore.getState().isAuthenticated).toBe(false)
  })

  it('initializeAuth delegates to fetchMe', async () => {
    const fetchMeSpy = vi
      .spyOn(useUserStore.getState(), 'fetchMe')
      .mockResolvedValueOnce()

    await initializeAuth()

    expect(fetchMeSpy).toHaveBeenCalledTimes(1)
  })
})

import axios, { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from '@/lib/api-error'

describe('getApiErrorMessage', () => {
  it('returns the fallback for non-axios errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Fallback')).toBe('Fallback')
  })

  it('returns a string message from an axios response', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { message: 'Bad request' },
    } as never

    expect(getApiErrorMessage(error, 'Fallback')).toBe('Bad request')
  })

  it('joins an array of backend messages', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { message: ['Email is required', 'Password is required'] },
    } as never

    expect(getApiErrorMessage(error, 'Fallback')).toBe(
      'Email is required, Password is required',
    )
  })

  it('returns the fallback for blank axios messages', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { message: '   ' },
    } as never

    expect(getApiErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('matches axios.isAxiosError semantics', () => {
    const error = new AxiosError('Request failed')
    expect(axios.isAxiosError(error)).toBe(true)
  })
})

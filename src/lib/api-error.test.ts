import axios from 'axios'
import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from './api-error'

describe('getApiErrorMessage', () => {
  it('returns the fallback for non-axios errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Fallback message')).toBe(
      'Fallback message',
    )
  })

  it('returns a string API message when present', () => {
    const error = new axios.AxiosError('Request failed')
    error.response = {
      data: { message: 'Backend says no.' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as never },
    }

    expect(getApiErrorMessage(error, 'Fallback message')).toBe(
      'Backend says no.',
    )
  })

  it('joins array API messages and falls back for blank strings', () => {
    const listError = new axios.AxiosError('Validation failed')
    listError.response = {
      data: { message: ['Title is required', 'Image URL is invalid'] },
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: {} as never },
    }

    expect(getApiErrorMessage(listError, 'Fallback message')).toBe(
      'Title is required, Image URL is invalid',
    )

    const blankError = new axios.AxiosError('Blank message')
    blankError.response = {
      data: { message: '   ' },
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: { headers: {} as never },
    }

    expect(getApiErrorMessage(blankError, 'Fallback message')).toBe(
      'Fallback message',
    )
  })
})

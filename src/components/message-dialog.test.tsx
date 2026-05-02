import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MessageDialog } from '@/components/message-dialog'

describe('MessageDialog', () => {
  it('renders nothing useful when there is no message', () => {
    render(<MessageDialog message={null} onOpenChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('renders the default message content', () => {
    render(
      <MessageDialog
        message={{
          title: 'Team created',
          description: 'Your squad is ready.',
        }}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Team created')).toBeTruthy()
    expect(screen.getByText('Your squad is ready.')).toBeTruthy()
  })

  it('renders destructive details and closes via the footer button', () => {
    const onOpenChange = vi.fn()

    render(
      <MessageDialog
        message={{
          title: 'Save failed',
          description: 'Try again later.',
          variant: 'destructive',
        }}
        onOpenChange={onOpenChange}
      />,
    )

    expect(screen.getByText('Review the details below.')).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

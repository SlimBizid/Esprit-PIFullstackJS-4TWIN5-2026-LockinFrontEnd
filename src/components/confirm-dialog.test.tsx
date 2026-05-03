import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from '@/components/confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders the provided title and description when open', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Delete team"
        description="This action cannot be undone."
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('Delete team')).toBeTruthy()
    expect(screen.getByText('This action cannot be undone.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy()
  })

  it('calls handlers and reflects pending state', () => {
    const onOpenChange = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete team"
        description="This action cannot be undone."
        confirmLabel="Delete"
        isPending
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Working...' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('invokes confirm when not pending', () => {
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Remove invite"
        description="Proceed?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

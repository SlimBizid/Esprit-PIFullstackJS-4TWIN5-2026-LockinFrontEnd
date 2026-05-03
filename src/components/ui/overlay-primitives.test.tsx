import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

describe('overlay and media primitives', () => {
  it('renders avatar pieces with slot and size metadata', () => {
    render(
      <AvatarGroup>
        <Avatar size="lg">
          <AvatarImage alt="Ram avatar" src="/ram.png" />
          <AvatarFallback>RA</AvatarFallback>
          <AvatarBadge>+</AvatarBadge>
        </Avatar>
        <AvatarGroupCount>+2</AvatarGroupCount>
      </AvatarGroup>,
    )

    expect(screen.getByText('RA').getAttribute('data-slot')).toBe('avatar-fallback')
    expect(screen.getByText('+').getAttribute('data-slot')).toBe('avatar-badge')
    expect(screen.getByText('+2').getAttribute('data-slot')).toBe(
      'avatar-group-count',
    )
    const avatarRoot = document.querySelector('[data-slot="avatar"]')
    expect(avatarRoot?.getAttribute('data-size')).toBe('lg')
    expect(document.querySelector('[data-slot="avatar-group"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="avatar-group-count"]')).toBeTruthy()
  })

  it('renders progress with the expected transform', () => {
    render(<Progress value={75} />)

    const indicator = document.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toBeTruthy()
    expect(indicator?.getAttribute('style')).toContain('translateX(-25%)')
  })

  it('renders labels with the right slot marker', () => {
    render(
      <Label htmlFor="email" className="custom-label">
        Email
      </Label>,
    )

    const label = screen.getByText('Email')
    expect(label.getAttribute('data-slot')).toBe('label')
    expect(label.getAttribute('for')).toBe('email')
    expect(label.className).toContain('custom-label')
  })

  it('renders dialog content and supports footer close button', () => {
    render(
      <Dialog open>
        <DialogTrigger>Launch</DialogTrigger>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete team</DialogTitle>
            <DialogDescription>Confirm removal.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <button type="button">Extra action</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByText('Delete team').getAttribute('data-slot')).toBe(
      'dialog-title',
    )
    expect(screen.getByText('Confirm removal.').getAttribute('data-slot')).toBe(
      'dialog-description',
    )
    expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeTruthy()
  })

  it('shows tooltip content when open', () => {
    render(
      <Tooltip open>
        <TooltipTrigger asChild>
          <button type="button">Help</button>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>Helpful hint</TooltipContent>
      </Tooltip>,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Help' }))
    const tooltipContent = document.querySelector('[data-slot="tooltip-content"]')
    expect(tooltipContent).toBeTruthy()
    expect(tooltipContent?.textContent).toContain('Helpful hint')
  })
})

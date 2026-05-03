import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

describe('Select primitives', () => {
  it('renders trigger and open content primitives', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger size="sm" aria-label="Select language">
          <SelectValue placeholder="Choose one" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            <SelectLabel>Languages</SelectLabel>
            <SelectItem value="ts">TypeScript</SelectItem>
            <SelectSeparator />
            <SelectItem value="py">Python</SelectItem>
          </SelectGroup>
          <SelectScrollUpButton />
          <SelectScrollDownButton />
        </SelectContent>
      </Select>,
    )

    const trigger = document.querySelector('[data-slot="select-trigger"]')
    expect(trigger).toBeTruthy()
    expect(trigger?.getAttribute('data-size')).toBe('sm')
    expect(trigger?.getAttribute('aria-label')).toBe('Select language')
    expect(document.querySelector('[data-slot="select-value"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="select-content"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="select-group"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="select-label"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="select-item"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="select-separator"]')).toBeTruthy()
    expect(screen.getByText('TypeScript')).toBeTruthy()
    expect(screen.getByText('Python')).toBeTruthy()
  })
})

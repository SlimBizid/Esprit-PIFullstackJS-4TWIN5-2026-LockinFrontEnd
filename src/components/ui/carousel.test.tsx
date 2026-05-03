import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const scrollPrev = vi.fn()
const scrollNext = vi.fn()
const on = vi.fn()
const off = vi.fn()
const emblaApi = {
  canScrollPrev: () => true,
  canScrollNext: () => true,
  scrollPrev,
  scrollNext,
  on,
  off,
}

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [vi.fn(), emblaApi]),
}))

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

describe('Carousel primitives', () => {
  it('renders carousel structure and delegates navigation', () => {
    const setApi = vi.fn()

    render(
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    )

    expect(document.querySelector('[data-slot="carousel"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="carousel-content"]')).toBeTruthy()
    expect(document.querySelectorAll('[data-slot="carousel-item"]').length).toBe(2)
    expect(setApi).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))

    expect(scrollPrev).toHaveBeenCalledTimes(1)
    expect(scrollNext).toHaveBeenCalledTimes(1)
    expect(on).toHaveBeenCalled()
  })
})

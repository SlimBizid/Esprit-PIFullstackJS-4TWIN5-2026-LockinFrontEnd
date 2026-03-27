import BenefitsSection from '@/components/BenefitsSection'
import HeroSection from '@/components/HeroSection'
import StoryTelling from '@/components/StoryTelling'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

/**
 * Blinks the tab title between "LockIN" and "LockIN_".
 * Respects prefers-reduced-motion: when the user has requested reduced motion
 * the title is set once and never blinked (WCAG 2.3.3 / 2.2.2).
 */
export function useTabBlinker() {
  const [isTick, setIsTick] = useState(false)

  useEffect(() => {
    // Honour the OS-level reduced-motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      document.title = 'LockIN_'
      return
    }

    const interval = setInterval(() => {
      setIsTick((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Only run the blink effect when the interval is active (non-reduced-motion)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    document.title = isTick ? 'LockIN' : 'LockIN_'
  }, [isTick])
}

function App() {
  useTabBlinker()

  return (
    <main id="main-content" tabIndex={-1} className="outline-none space-y-16">
      <HeroSection />
      <StoryTelling />
      <BenefitsSection />
    </main>
  )
}

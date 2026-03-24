import BenefitsSection from '@/components/BenefitsSection'
import HeroSection from '@/components/HeroSection'
import StoryTelling from '@/components/StoryTelling'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
export const Route = createFileRoute('/')({
  component: App,
})

export function useTabBlinker() {
  const [isTick, setIsTick] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTick((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.title = isTick ? 'LockIN' : 'LockIN_'
  }, [isTick])
}

function App() {
  useTabBlinker()
  return (
    <div className="space-y-16">
      <HeroSection />
      <StoryTelling />
      <BenefitsSection />
    </div>
  )
}

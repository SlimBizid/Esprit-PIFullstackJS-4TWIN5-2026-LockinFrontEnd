import BenefitsSection from '@/components/BenefitsSection'
import HeroSection from '@/components/HeroSection'
import StoryTelling from '@/components/StoryTelling'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="space-y-16">
      <HeroSection />
      <StoryTelling />
      <BenefitsSection />
    </div>
  )
}

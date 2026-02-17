import BenefitsSection from '@/components/BenefitsSection'
import HeroSection from '@/components/HeroSection'
import StoryTelling from '@/components/StoryTelling'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div>
      <HeroSection />
      <StoryTelling />
      <BenefitsSection />
    </div>
  )
}

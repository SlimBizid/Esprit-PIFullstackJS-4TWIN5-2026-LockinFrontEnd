import { Seo } from '@/components/Seo'
import BenefitsSection from '@/components/BenefitsSection'
import HeroSection from '@/components/HeroSection'
import StoryTelling from '@/components/StoryTelling'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <main id="main-content" tabIndex={-1} className="outline-none space-y-16">
      <Seo
        title="LockIN | Competitive coding challenges and team battles"
        description="LockIN helps you practice coding with solo challenges, CSS battles, challenge reviews, and team competition."
        path="/"
      />
      <HeroSection />
      <StoryTelling />
      <BenefitsSection />
    </main>
  )
}

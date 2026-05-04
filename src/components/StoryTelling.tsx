import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export default function StoryTelling() {
  return (
    <section
      aria-labelledby="storytelling-heading"
      className="w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-32 bg-background"
    >
      <h2 id="storytelling-heading" className="sr-only">
        What is LockIN
      </h2>

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="flex items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl bg-[#c4a0f0]" />
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-destructive">
              What is LockIN?
            </h3>
            <p className="text-foreground text-base sm:text-lg leading-relaxed">
              LockIN is a real-time competitive coding platform where developers
              face off in live coding battles.
            </p>
            <p className="text-foreground text-base sm:text-lg leading-relaxed">
              Participants solve algorithmic and programming challenges under
              time pressure, competing for speed, accuracy, and code quality.
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

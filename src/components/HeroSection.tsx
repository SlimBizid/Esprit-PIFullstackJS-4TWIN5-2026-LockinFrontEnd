import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-background flex items-center justify-center px-4 py-12 md:py-20">
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <Badge variant="secondary" className="text-xs md:text-sm">
          Now live
        </Badge>

        <h1 className="text-6xl md:text-7xl font-bold text-foreground tracking-tight">
          LockIN
        </h1>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-2xl md:text-3xl font-semibold leading-relaxed">
          <span className="text-pink-400">Compete.</span>
          <span className="text-blue-400">Code.</span>
          <span className="text-cyan-400">Level Up.</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-lg transition-colors"
          >
            <Link to="/auth/register">
              Start Now
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="px-8 py-6 text-lg rounded-lg transition-colors"
          >
            <Link to="/home">
              Explore More
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 opacity-40"></div>
    </section>
  )
}

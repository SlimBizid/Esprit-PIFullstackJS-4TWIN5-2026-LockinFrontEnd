import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useState, useCallback } from 'react'
import type { CarouselApi } from '@/components/ui/carousel'

const BENEFITS = [
  {
    title: "Built for the 'Unfocused' Genius",
    description:
      'We target talented coders addicted to gaming who need a better dopamine loop to build discipline.',
    rarity: 'text-rarity-common',
    tag: 'NICHE',
  },
  {
    title: 'The Pet House Mechanic',
    description:
      'Equip unique pets to gain small buffs during unranked challenges. Turn mundane tasks into RPG progression.',
    rarity: 'text-rarity-rare',
    tag: 'GAMIFIED',
  },
  {
    title: 'Anti-Sabotage Training',
    description:
      "Our 'Coders VS Imposter' mode trains you to spot bugs and intentional sabotage in high-stakes relay coding.",
    rarity: 'text-rarity-epic',
    tag: 'EXCLUSIVE',
  },
  {
    title: 'True Ownership',
    description:
      'Every border, badge, and title is a trophy earned. No custom uploads—your profile reflects your actual milestones.',
    rarity: 'text-rarity-legendary',
    tag: 'RANKED',
  },
]

export default function BenefitsSection() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(1)

  const handleSetApi = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setApi(carouselApi)
    setCurrent(carouselApi.selectedScrollSnap() + 1)
    carouselApi.on('select', () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1)
    })
  }, [])

  return (
    <section
      id="benefits"
      aria-labelledby="benefits-heading"
      className="w-full py-16 sm:py-24 bg-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-12 gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <p
              aria-hidden="true"
              className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4"
            >
              Core Mechanics
            </p>
            <h2
              id="benefits-heading"
              className="text-3xl md:text-5xl font-mono-one text-foreground uppercase tracking-tighter"
            >
              A Platform that{' '}
              <span className="text-primary text-glow">Understands</span> the
              Grind.
            </h2>
          </div>
        </div>

        <Carousel
          setApi={handleSetApi}
          className="w-full"
          opts={{ align: 'start', loop: true }}
          aria-label="Platform benefits"
          aria-roledescription="carousel"
        >
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            Slide {current} of {BENEFITS.length}
          </div>

          <CarouselContent className="-ml-4">
            {BENEFITS.map((benefit, index) => (
              <CarouselItem
                key={benefit.title}
                className="pl-4 md:basis-1/2 lg:basis-1/3 border border-border mx-2 rounded-lg"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${BENEFITS.length}: ${benefit.title}`}
              >
                <div className="h-full p-6 sm:p-8 rounded-2xl backdrop-blur-sm flex flex-col justify-between transition-colors group cursor-grab active:cursor-grabbing">
                  <div>
                    <span
                      aria-label={`Rarity: ${benefit.tag}`}
                      className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase bg-secondary px-2 py-1 rounded mb-6 inline-block"
                    >
                      {benefit.tag}
                    </span>

                    <h3
                      className={`text-xl sm:text-2xl font-bold ${benefit.rarity} mb-4 font-mono-one tracking-tight group-hover:text-foreground transition-colors`}
                    >
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
                    <span
                      aria-hidden="true"
                      className="text-xs font-mono text-primary/50"
                    >
                      L-IN // 00{index + 1}
                    </span>
                    <div
                      aria-hidden="true"
                      className="w-8 h-px bg-primary/30"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious
              aria-label="Previous benefit"
              className="static translate-y-0 border-border bg-background hover:bg-primary hover:text-primary-foreground transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            <CarouselNext
              aria-label="Next benefit"
              className="static translate-y-0 border-border bg-background hover:bg-primary hover:text-primary-foreground transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>
        </Carousel>
      </div>
    </section>
  )
}

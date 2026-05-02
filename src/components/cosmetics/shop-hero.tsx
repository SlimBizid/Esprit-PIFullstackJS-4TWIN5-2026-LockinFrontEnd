import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/components/cosmetics/utils'
import type { Cosmetic } from '@/models/cosmetic'

type ShopHeroProps = {
  featuredCosmetic: Cosmetic | null
}

export function ShopHero({ featuredCosmetic }: ShopHeroProps) {
  return (
    <section className="relative overflow-hidden border border-primary/20  px-6 py-8  sm:px-8 lg:px-10">
      <div className="absolute inset-x-0 top-0 h-px" />
      <div className="absolute -left-16 top-8 h-56 w-56 rounded-full " />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full " />
      <div className="absolute inset-y-0 right-0 w-[45%]" />
      <div className="absolute inset-0 bg-background bg-[size:34px_34px] opacity-25" />

      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-[11px] uppercase tracking-[0.34em] text-primary">
            LockIN armory
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-4xl font-mono-one text-3xl uppercase leading-[1.04] text-foreground sm:text-4xl lg:text-[3.2rem]">
              Load Out Your Profile
              <span className="block text-primary">Like You Mean It</span>
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Browse the item shop for banners, avatars, skins, and emotes that
              look earned, rare, and a little dangerous. This is where your
              profile stops looking default.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="h-11 rounded-full px-6" asChild>
              <Link to="/cosmetics">Browse cosmetics</Link>
            </Button>
            {featuredCosmetic ? (
              <Button
                variant="outline"
                className="h-11 rounded-full border-primary/25 bg-background/40 px-6"
                asChild
              >
                <Link to="/cosmetic/$id" params={{ id: featuredCosmetic.id }}>
                  Inspect featured drop
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] border border-primary/10 bg-primary/5" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 b p-4 ">
            {featuredCosmetic ? (
              <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr] sm:items-center">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(4,10,8,0.92),rgba(8,16,12,0.98))]">
                  <div className="absolute left-4 top-4 z-10">
                    <Badge className="rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-primary backdrop-blur">
                      Featured drop
                    </Badge>
                  </div>
                  <div className="aspect-[4/5]">
                    <img
                      src={featuredCosmetic.imageUrl}
                      alt={featuredCosmetic.cosmeticTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,13,0.92))] px-4 pb-4 pt-10">
                    <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                      Store spotlight
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-2 sm:p-4">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-primary/70">
                    High visibility gear
                  </p>
                  <h2 className="text-2xl font-black leading-tight text-foreground">
                    {featuredCosmetic.cosmeticTitle}
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {featuredCosmetic.cosmeticDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="border border-primary/20 bg-primary px-4 py-2 text-sm font-semibold whitespace-nowrap text-primary-foreground">
                      {formatPrice(featuredCosmetic.price)}
                    </div>
                    <div className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Limited profile flex
                    </div>
                  </div>

                  <Button
                    asChild
                    className="h-11 rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-600"
                  >
                    <Link
                      to="/cosmetic/$id"
                      params={{ id: featuredCosmetic.id }}
                    >
                      View item
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70  p-8 text-center text-sm text-muted-foreground">
                No featured item is available right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

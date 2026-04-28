import { Cat, HatGlasses } from 'lucide-react'

export default function StoryTelling() {
  return (
    <section
      aria-labelledby="storytelling-heading"
      className="w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-32 bg-accent"
    >
      <h2 id="storytelling-heading" className="sr-only">
        Our Story
      </h2>

      <div className="max-w-7xl mx-auto space-y-20 sm:space-y-32">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl md:text-5xl font-mono-one text-destructive uppercase tracking-tight">
              The Problem: <br />
              <span className="text-foreground">The Distraction Loop</span>
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Most platforms target elite competitive programmers who already
              have discipline. But what about the coders addicted to gaming? The
              ones who have the talent but lack the focus? At{' '}
              <strong>Dusk&amp;Dawn</strong>, we realized the tech giants are
              ignoring the niche market of "gamified discipline".
            </p>
          </div>

          <div
            className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden relative group"
            aria-label="Illustration: the distraction loop in code"
          >
            <p
              aria-hidden="true"
              className="absolute top-0 right-0 p-4 font-mono text-xs text-destructive"
            >
              ERROR: Focus_Lost
            </p>

            <figure aria-hidden="true">
              <pre className="text-sm font-mono text-foreground  select-none overflow-x-auto">
                <code>{`while(isGaming) {
  improveCodingSkills = false;
  discipline--;
  futureSuccess = null;
}`}</code>
              </pre>
            </figure>

            <div
              role="alert"
              aria-label="Locked Out by Distractions"
              className="mt-4 p-4 bg-background border border-destructive/20 rounded-lg text-destructive font-bold text-center"
            >
              Locked Out by Distractions
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div
            className="order-2 md:order-1 bg-card border border-primary/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,207,186,0.1)] relative"
            aria-label="Solution features"
          >
            <ul className="space-y-4" role="list">
              <li className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border">
                <div
                  aria-hidden="true"
                  className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary"
                >
                  <HatGlasses className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    Coders VS Imposter
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inspired by Town of Salem. Identify the saboteur in your
                    relay code.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border">
                <div
                  aria-hidden="true"
                  className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary"
                >
                  <Cat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    Pet Character Buffs
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Equip pets to gain small advantages during unranked
                    challenges.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="order-1 md:order-2 space-y-6">
            <h3 className="text-3xl md:text-5xl font-mono-one text-primary uppercase tracking-tight">
              The Solution: <br />
              <span className="text-foreground">Gamified Grind</span>
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              We shifted the competition from tech giants to the game-dev
              industry.
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              <strong>LockIn</strong> uses XP indicators to show dedication, not
              just skill. With 1v1 optimization duels and daily quests, we turn
              the dopamine of gaming into the discipline of coding.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

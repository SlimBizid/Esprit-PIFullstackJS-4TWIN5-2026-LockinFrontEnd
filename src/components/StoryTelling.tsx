import { Cat, HatGlasses } from "lucide-react";

export default function StoryTelling() {
  return (
    <section className="w-full py-24 px-32 bg-accent">
      <div className="max-w-7xl mx-auto space-y-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-mono-one text-destructive uppercase tracking-tight">
              The Problem: <br />
              <span className="text-foreground text-wrap">
                The Distraction Loop
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Most platforms target elite competitive programmers who already
              have discipline. But what about the coders addicted to gaming? The
              ones who have the talent but lack the focus? At{' '}
              <strong>Dusk&Dawn</strong>, we realized the tech giants are
              ignoring the niche market of "gamified discipline".
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 font-mono text-xs text-destructive/50">
              ERROR: Focus_Lost
            </div>
            <pre className="text-sm font-mono text-muted-foreground opacity-40 select-none">
              {`while(isGaming) {
  improveCodingSkills = false;
  discipline--;
  futureSuccess = null;
}`}
            </pre>
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive font-bold text-center">
              Locked Out by Distractions
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-card border border-primary/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,207,186,0.1)] relative">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  <HatGlasses />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    Coders VS Imposter
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Inspired by Town of Salem. Identify the saboteur in your
                    relay code.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  <Cat />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    Pet Character Buffs
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Equip pets to gain small advantages during unranked
                    challenges.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl md:text-5xl font-mono-one text-primary uppercase tracking-tight">
              The Solution: <br />
              <span className="text-foreground">Gamified Grind</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We shifted the competition from tech giants to the game-dev
              industry.
            </p>
            <p>
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

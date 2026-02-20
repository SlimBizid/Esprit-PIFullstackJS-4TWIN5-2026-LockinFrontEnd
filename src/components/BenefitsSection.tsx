import { Link } from "@tanstack/react-router"

export default function BenefitsSection() {
  return (
    <section className="bg-background py-32 px-6">
      <div className="max-w-6xl mx-auto text-center">

        {/* SECTION HEADER */}
        <div className="flex items-center justify-center gap-6 mb-24">
          <div className="flex items-center gap-3 w-1/3">
            <div className="h-[1px] flex-1 bg-border" />
            <div className="w-2 h-2 rounded-full bg-border" />
          </div>

          <div className="leading-none font-keania-one">
            <p className="text-2xl tracking-[0.3em] text-muted-foreground mb-2 ">
              EXPLORE
            </p>
            <p className="text-4xl md:text-5xl tracking-widest text-foreground">
              CHALLENGES
            </p>
          </div>

          <div className="flex items-center gap-3 w-1/3">
            <div className="w-2 h-2 rounded-full bg-border" />
            <div className="h-[1px] flex-1 bg-border" />
          </div>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-10">

          {/* SOLO */}
          <Link
            to="/challenges/solo"
            className="group bg-card border border-border rounded-xl p-8 text-left transition-all duration-300 hover:border-primary hover:shadow-xl"
          >
            <div className="h-40 bg-primary rounded-lg mb-6" />

            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Go on solo challenges
            </h3>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Compete individually and sharpen your algorithmic thinking
              through timed coding challenges.
            </p>
          </Link>

          {/* TEAM */}
          <Link
            to="/challenges/team"
            className="group bg-card border border-border rounded-xl p-8 text-left transition-all duration-300 hover:border-primary hover:shadow-xl"
          >
            <div className="h-40 bg-primary rounded-lg mb-6" />

            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Join team challenges
            </h3>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Join forces with other developers and solve challenges
              collaboratively under real-time pressure.
            </p>
          </Link>

          {/* 1v1 */}
          <Link
            to="/challenges/battle"
            className="group bg-card border border-border rounded-xl p-8 text-left transition-all duration-300 hover:border-primary hover:shadow-xl"
          >
            <div className="h-40 bg-primary rounded-lg mb-6" />

            <h3 className="text-lg font-semibold mb-3 text-foreground">
              Engage in 1v1 battles
            </h3>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Face off against another coder and prove your speed,
              accuracy, and problem-solving skills.
            </p>
          </Link>

        </div>
      </div>
    </section>
  )
}

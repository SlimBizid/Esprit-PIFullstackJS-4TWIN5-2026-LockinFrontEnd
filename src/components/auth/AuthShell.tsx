import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

interface AuthShellProps {
  heading: string
  subheading: string
  children: ReactNode
}

const STATS = [
  { value: '12k+', label: 'Active coders' },
  { value: '98%', label: 'Retention rate' },
  { value: '4.9', label: 'Avg. rating' },
]

export function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <aside
        aria-hidden="true"
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between
                   bg-background text-foreground p-12 xl:p-16 relative overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-black text-xl tracking-tight
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                       focus-visible:ring-offset-foreground rounded-sm"
          >
            LockIN<span className="text-primary animate-peekaboo">_</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-foreground/50">
            The competitive coding arena
          </p>
          <h2 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight">
            Turn your gaming
            <br />
            habit into a <span className="text-primary">coding</span>
            <br />
            superpower.
          </h2>
          <p className="text-foreground/60 text-sm leading-relaxed max-w-xs">
            XP, pets, duels, and leaderboards — everything you love about
            gaming, applied to real programming challenges.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-background/10">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-black text-primary">{value}</p>
              <p className="text-[11px] text-foreground/50 uppercase tracking-wider mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </aside>

      <main
        className="flex-1 flex flex-col items-center justify-center
                   px-4 sm:px-8 md:px-16 py-12 bg-background"
      >
        <Link
          to="/"
          className="lg:hidden mb-10 font-black text-xl tracking-tight
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          aria-label="Go to LockIN homepage"
        >
          LockIN<span className="text-primary animate-peekaboo">_</span>
        </Link>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {heading}
            </h1>
            <p className="text-muted-foreground text-sm">{subheading}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}

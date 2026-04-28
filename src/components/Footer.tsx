import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from './ui/avatar'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

const FOOTER_SECTIONS = [
  {
    heading: 'Gamemodes',
    links: [
      'Solo Challenges',
      '1v1 Duels',
      'Team Contests',
      'Coders VS Imposter',
    ],
  },
  {
    heading: 'Rankings',
    links: ['Leaderboard', 'Season History', 'Achievement Log', 'Rank Titles'],
  },
  {
    heading: 'Collection',
    links: ['Pet House', 'Inventory', 'Cosmetic Rarity', 'Profile Borders'],
  },
  {
    heading: 'Community',
    links: ['Challenge Reviews', 'Report System', 'Team Chat'],
  },
  {
    heading: 'The Lab',
    links: [
      'Daily Quests',
      'AI Challenge Gen',
      'Code Optimization',
      'Bug Hunting',
    ],
  },
  {
    heading: 'Project',
    links: ['Meet Dusk&Dawn', 'Technical Diagrams', 'Esprit 2026'],
  },
]

const TEAM_MEMBERS = [
  {
    href: 'https://github.com/Oumeima-IbnElfekih',
    src: 'https://avatars.githubusercontent.com/u/58104890?v=4',
    fallback: 'OI',
    name: 'Oumeima IbnElfekih',
  },
  {
    href: 'https://github.com/drumino',
    src: 'https://avatars.githubusercontent.com/u/123776531?v=4',
    fallback: 'AA',
    name: 'AA on GitHub',
  },
  {
    href: 'https://github.com/salmaaaaaaaaaaaaaaaa',
    src: 'https://avatars.githubusercontent.com/u/131760468?v=4',
    fallback: 'SB',
    name: 'Salma on GitHub',
  },
  {
    href: 'https://github.com/SlimBizid',
    src: 'https://avatars.githubusercontent.com/u/125152034?v=4',
    fallback: 'SB',
    name: 'Slim Bizid',
  },
  {
    href: 'https://github.com/RamOfFate',
    src: 'https://avatars.githubusercontent.com/u/257519557?v=4',
    fallback: 'TM',
    name: 'TM on GitHub',
  },
  {
    href: 'https://github.com/zeeyach',
    src: 'https://avatars.githubusercontent.com/u/132415981?v=4',
    fallback: 'ZA',
    name: 'Zeeyach on GitHub',
  },
]

export default function Footer() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <footer aria-label="Site footer" className="border-t border-border">
      <div className="border-border border-t px-4 sm:px-8 lg:px-20 select-none font-semibold">
        <div className="border-x border-border flex flex-col">
          <div className="p-6 sm:p-12 sm:pt-16 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 border-b border-border">
            <p className="text-lg font-black">LockIn</p>

            <nav aria-label="Team members">
              <AvatarGroup>
                {TEAM_MEMBERS.map(({ href, src, fallback, name }) => (
                  <Avatar key={href} size="lg" className="cursor-pointer">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${name} on GitHub (opens in new tab)`}
                    >
                      <AvatarImage src={src} alt={name} />
                    </a>
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            </nav>
          </div>

          <nav
            aria-label="Footer navigation"
            className="border-border border-b p-6 sm:p-8 py-10 sm:py-16"
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
              {FOOTER_SECTIONS.map(({ heading, links }) => (
                <li key={heading}>
                  <p
                    className="uppercase font-semibold text-muted-foreground text-xs tracking-widest mb-3"
                    id={`footer-${heading.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {heading}
                  </p>
                  <ul
                    aria-labelledby={`footer-${heading.replace(/\s+/g, '-').toLowerCase()}`}
                    className="space-y-2"
                  >
                    {links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm hover:underline hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-colors"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-12 pb-12 sm:pb-24 relative">
            <div
              role="status"
              aria-live="polite"
              aria-label="Engine status: Locking in"
              className="flex items-center gap-2 text-sm bg-secondary px-4 py-2 rounded-full"
            >
              <span aria-hidden="true" className="relative shrink-0 w-3 h-3">
                <span className="w-3 h-3 rounded-full bg-primary animate-ping absolute" />
                <span className="w-3 h-3 rounded-full bg-primary relative block" />
              </span>
              <p>ENGINE STATUS: LOCKING IN...</p>
            </div>

            <small className="text-sm text-muted-foreground sm:absolute sm:inset-x-0 sm:mx-auto sm:w-fit text-center">
              © 2026 LockIN — All rights reserved
            </small>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={
                    isDark ? 'Switch to light mode' : 'Switch to dark mode'
                  }
                  className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {isDark ? (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </footer>
  )
}

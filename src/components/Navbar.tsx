import { lazy, Suspense, useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet'
import { Link } from '@tanstack/react-router'
import { useUser, useIsAuthenticated, useUserStore } from '@/stores/userStore'
import { LogOut, Menu, X } from 'lucide-react'

const AccessibilitySettingsMenu = lazy(
  () => import('@/components/accessibility/AccessibilitySettingsMenu'),
)

const NAV_LINKS = [
  { to: '/cosmetics', label: 'Shop' },
  { to: '/teams', label: 'Teams' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/challenges', label: 'Challenges' },
] as const

const Logo = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 230 230"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <g clipPath="url(#clip0_378_495)">
      <g filter="url(#filter0_d_378_495)">
        <rect
          x="24"
          y="24"
          width="182"
          height="182"
          rx="10"
          strokeWidth="20"
          shapeRendering="crispEdges"
          className="stroke-primary"
        />
      </g>
      <g filter="url(#filter1_d_378_495)">
        <path
          d="M63.3833 104L94.7667 135.383L63.3833 166.767"
          className="stroke-primary"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </g>
      <g filter="url(#filter2_d_378_495)">
        <path
          d="M134 134.5H173"
          strokeWidth="20"
          strokeLinecap="round"
          className="animate-peekaboo stroke-primary"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_378_495"
        x="-5.3"
        y="-1.3"
        width="240.6"
        height="240.6"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius="5"
          operator="dilate"
          in="SourceAlpha"
          result="effect1_dropShadow_378_495"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="7.15" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0.811765 0 0 0 0 0.729412 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_378_495"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_378_495"
          result="shape"
        />
      </filter>
      <filter
        id="filter1_d_378_495"
        x="34.0833"
        y="78.7"
        width="94.1256"
        height="121.367"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius="5"
          operator="dilate"
          in="SourceAlpha"
          result="effect1_dropShadow_378_495"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="7.15" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0.811765 0 0 0 0 0.729412 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_378_495"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_378_495"
          result="shape"
        />
      </filter>
      <filter
        id="filter2_d_378_495"
        x="104.7"
        y="109.2"
        width="97.6"
        height="58.6"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius="5"
          operator="dilate"
          in="SourceAlpha"
          result="effect1_dropShadow_378_495"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="7.15" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0.811765 0 0 0 0 0.729412 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_378_495"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_378_495"
          result="shape"
        />
      </filter>
      <clipPath id="clip0_378_495">
        <rect width="230" height="230" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

export default function Navbar() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navId = useId()

  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const logout = useUserStore((s) => s.logout)
  const isLoading = useUserStore((s) => s.isLoading)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrollProgress(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getNavbarBg = () => {
    if (scrollProgress < 10) return 'bg-transparent border-transparent'
    if (scrollProgress < 200)
      return 'bg-background/60 backdrop-blur-md border-border/50'
    return 'bg-background border-border shadow-lg'
  }

  const navLinks =
    user?.type === 'admin'
      ? [...NAV_LINKS, { to: '/admin' as const, label: 'Admin' }]
      : NAV_LINKS

  return (
    <>
      

      <header
        role="banner"
        className={`fixed inset-x-0 top-0 border-b ${getNavbarBg()} transition-all duration-300 z-50`}
      >
        <nav
          id={navId}
          aria-label="Main navigation"
          className="flex justify-between items-center px-4 h-16 max-w-7xl mx-auto relative"
        >
          <div className="flex justify-start">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="LockIN – go to homepage"
            >
              <Logo />
              <span className="font-black text-lg" aria-hidden="true">
                LockIN<span className="text-primary animate-peekaboo">_</span>
              </span>
            </Link>
          </div>

          <ul
            className="hidden md:flex md:w-fit mx-auto justify-center items-center gap-6 font-semibold absolute inset-x-0"
            role="list"
          >
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeProps={{ className: 'text-primary' }}
                  className="
                    relative py-1 hover:text-primary transition-colors
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm
                  "
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <div>
                  <Link to="/auth/register">
                    <Button
                      variant="secondary"
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link to="/auth/login">
                    <Button className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                      Log In
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span
                  className="text-primary font-bold"
                  aria-label={`Logged in as ${user?.username}`}
                >
                  <Link
                    to="/profile/$userId"
                    params={{ userId: user?.username ?? '' }}
                    className="font-mono text-sm text-primary hover:opacity-80 transition-opacity tracking-widest uppercase"
                    aria-label={`View profile of ${user?.username}`}
                  >
                    {user?.username}
                    <span className="animate-peekaboo" aria-hidden="true">
                      _
                    </span>
                  </Link>
                </span>
                <Button
                  onClick={handleLogout}
                  disabled={isLoading}
                  aria-busy={isLoading}
                  variant={'outline'}
                  className="font-semibold"
                  aria-label="Logout"
                >
                  <LogOut />
                </Button>
              </>
            )}

            <Suspense fallback={null}>
              <AccessibilitySettingsMenu />
            </Suspense>
          </div>

          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <Tooltip>
                <SheetTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        mobileOpen
                          ? 'Close navigation menu'
                          : 'Open navigation menu'
                      }
                      aria-expanded={mobileOpen}
                      aria-controls="mobile-nav-panel"
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {mobileOpen ? (
                        <X className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Menu className="h-5 w-5" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                </SheetTrigger>
                <TooltipContent>
                  {mobileOpen
                    ? 'Close navigation menu'
                    : 'Open navigation menu'}
                </TooltipContent>
              </Tooltip>

              <SheetContent
                id="mobile-nav-panel"
                side="right"
                className="w-80 flex flex-col h-full"
                aria-label="Mobile navigation"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                <div className="pt-6">
                  <SheetClose asChild>
                    <Link to="/" className="flex items-center gap-2 px-2">
                      <Logo />
                      <span className="font-black text-lg">
                        LockIN<span className="text-primary">_</span>
                      </span>
                    </Link>
                  </SheetClose>
                </div>

                <nav
                  className="flex-1 mt-8"
                  aria-label="Mobile navigation links"
                >
                  <ul className="flex flex-col gap-2">
                    {navLinks.map(({ to, label }) => (
                      <li key={to}>
                        <SheetClose asChild>
                          <Link
                            to={to}
                            activeProps={{
                              className: 'text-primary bg-primary/5',
                            }}
                            className="flex items-center w-full px-4 py-3 font-semibold text-lg rounded-lg transition-colors"
                          >
                            {label}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="mt-auto border-t pt-6 pb-8 flex flex-col gap-3 px-4">
                  <Suspense fallback={null}>
                    <AccessibilitySettingsMenu mobile />
                  </Suspense>

                  {!isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Link to="/auth/login" className="w-full">
                          <Button
                            variant="outline"
                            className="w-full h-12 text-base"
                          >
                            Log In
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/auth/register" className="w-full">
                          <Button className="w-full h-12 text-base">
                            Sign Up
                          </Button>
                        </Link>
                      </SheetClose>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="px-2 text-sm text-muted-foreground text-center">
                        Signed in as{' '}
                        <span className="text-foreground font-bold">
                          {user?.username}
                        </span>
                      </p>
                      <Button
                        onClick={() => {
                          setMobileOpen(false)
                          handleLogout()
                        }}
                        variant="link"
                        className="w-full h-12 text-destructive"
                        aria-label="Logout"
                      >
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    </>
  )
}

import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useUser, useIsAuthenticated, useUserStore } from '@/stores/userStore'

export default function Navbar() {
  const [scrollProgress, setScrollProgress] = useState(0)
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
    const handleScroll = () => {
      const position = window.scrollY
      setScrollProgress(position)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getNavbarBg = () => {
    if (scrollProgress < 10) return 'bg-transparent border-transparent'
    if (scrollProgress < 200)
      return 'bg-background/60 backdrop-blur-md border-border/50'
    return 'bg-background border-border shadow-lg'
  }

  const Logo = () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 230 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_378_495)">
        <g filter="url(#filter0_d_378_495)">
          <rect
            x="24"
            y="24"
            width="182"
            height="182"
            rx="10"
            stroke-width="20"
            shape-rendering="crispEdges"
            className="stroke-primary"
          />
        </g>
        <g filter="url(#filter1_d_378_495)">
          <path
            d="M63.3833 104L94.7667 135.383L63.3833 166.767"
            className="stroke-primary"
            stroke-width="20"
            stroke-linecap="round"
          />
        </g>
        <g filter="url(#filter2_d_378_495)">
          <path
            d="M134 134.5H173"
            stroke-width="20"
            stroke-linecap="round"
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
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
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
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
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
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
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

  return (
    <div className={` fixed inset-x-0 ${getNavbarBg()} transition-all z-50`}>
      <div className="flex justify-between items-center relative px-4 ">
        <div className="p-2 py-4 flex items-center gap-2">
          <Link to="/" className="flex gap-2 items-center">
            <Logo />
            <p className="font-black text-lg">
              LockIN<span className="text-primary animate-peekaboo">_</span>
            </p>
          </Link>
        </div>
        <ul className="flex gap-2 font-semibold h-full absolute mx-auto w-fit items-center inset-x-0">
          <Link to="/home" activeProps={{ className: 'text-primary' }}>
            <li className=" hover:text-primary select-none cursor-pointer">
              Home
            </li>
          </Link>
          <Link to="/leaderboard" activeProps={{ className: 'text-primary' }}>
            <li className=" hover:text-primary select-none cursor-pointer">
              Leaderboard
            </li>
          </Link>
          <Link to="/challenges" activeProps={{ className: 'text-primary' }}>
            <li className=" hover:text-primary select-none cursor-pointer">
              Challenges
            </li>
          </Link>
        </ul>
        <div className="flex gap-2">
          {!isAuthenticated ? (
            <>
              <Link to="/auth/register">
                <Button variant="secondary">Sign Up</Button>
              </Link>
              <Link to="/auth/login">
                <Button>Log In</Button>
              </Link>
            </>
          ) : (
            <>
              <span className="font-medium">{user?.username}</span>
              <Button onClick={handleLogout} disabled={isLoading}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

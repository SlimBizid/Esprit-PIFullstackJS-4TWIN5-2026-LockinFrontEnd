import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrollProgress, setScrollProgress] = useState(0)

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

  return (
    <div className={` fixed inset-x-0 ${getNavbarBg()} transition-all z-50`}>
      <div className="flex justify-between items-center relative px-4 ">
        <div className="p-2 py-4 flex items-center gap-2">
          <Link to="/">
            <p className="font-black text-lg">
              LockIN<span className="text-primary">_</span>
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
          <Link to="/auth/register">
            <Button variant="secondary">Sign Up</Button>
          </Link>
          <Link to="/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

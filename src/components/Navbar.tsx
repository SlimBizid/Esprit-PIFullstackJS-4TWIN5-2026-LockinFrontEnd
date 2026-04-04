import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function Navbar() {
  const { theme, setTheme } = useTheme()

  return (
    <div className=" px-4 flex justify-between items-center border-border border-b">
      <div className="p-2 flex items-center gap-2">
        <div className="h-10 aspect-square bg-primary rounded"></div>
        <Link to="/">
          <p className="font-black text-lg">LockIN</p>
        </Link>
      </div>
      <ul className="flex gap-2 font-semibold h-full ">
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
        <Link to="/cosmetics" activeProps={{ className: 'text-primary' }}>
          <li className=" hover:text-primary select-none cursor-pointer">
            Cosmetics
          </li>
        </Link>
      </ul>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setTheme(theme == 'light' ? 'dark' : 'light')}
        >
          {theme == 'dark' ? <Moon /> : <Sun />}
        </Button>
        <Link to="/auth/register">
          <Button variant="secondary">Sign Up</Button>
        </Link>
        <Link to="/auth/login">
          <Button>Log In</Button>
        </Link>
      </div>
    </div>
  )
}

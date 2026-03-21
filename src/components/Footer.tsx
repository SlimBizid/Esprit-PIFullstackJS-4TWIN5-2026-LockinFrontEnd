import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from './ui/avatar'
import { Button } from './ui/button'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function Footer() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="border-t border-gray-950">
      <div className="border-border border-t px-4 md:px-20 select-none font-semibold">
        <div className="border-x border-border flex flex-col">
          <div className="p-6 md:p-12 md:pt-16 flex flex-col gap-4 md:flex-row md:justify-between w-full border-b">
            <p>LockIn</p>
            <AvatarGroup>
              <Avatar size="sm" className="cursor-pointer">
                <a target="_blank" href="https://github.com/Oumeima-IbnElfekih">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/58104890?v=4" />
                </a>
                <AvatarFallback>OI</AvatarFallback>
              </Avatar>
              <Avatar size="sm" className="cursor-pointer">
                <a target="_blank" href="https://github.com/drumino">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/123776531?v=4" />
                </a>
                <AvatarFallback>AA</AvatarFallback>
              </Avatar>
              <Avatar size="sm" className="cursor-pointer">
                <a href="https://github.com/salmaaaaaaaaaaaaaaaa">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/131760468?v=4" />
                </a>
                <AvatarFallback>SB</AvatarFallback>
              </Avatar>
              <Avatar size="sm" className="cursor-pointer">
                <a target="_blank" href="https://github.com/SlimBizid">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/125152034?v=4" />
                </a>
                <AvatarFallback>SB</AvatarFallback>
              </Avatar>
              <Avatar size="sm" className="cursor-pointer">
                <a target="_blank" href="https://github.com/RamOfFate">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/257519557?v=4" />
                </a>
                <AvatarFallback>TM</AvatarFallback>
              </Avatar>
              <Avatar size="sm" className="cursor-pointer">
                <a target="_blank" href="https://github.com/zeeyach">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/132415981?v=4" />
                </a>
                <AvatarFallback>ZA</AvatarFallback>
              </Avatar>
            </AvatarGroup>
          </div>
          <div className="border-border border-b grid grid-cols-2 md:grid-cols-6 p-4 md:p-8 py-8 md:py-16">
            <ul className="col-span-1 px-4 space-y-2">
              <li className="uppercase font-semibold text-gray-400">
                Gamemodes
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Solo Challenges
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                1v1 Duels
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Team Contests
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Coders VS Imposter
              </li>
            </ul>
            <ul className="col-span-1 px-4 space-y-2">
              <li className="uppercase font-semibold text-gray-400">
                Rankings
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Leaderboard
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Season History
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Achievement Log
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Rank Titles
              </li>
            </ul>
            <ul className="col-span-1 px-4 space-y-2">
              <li className="uppercase font-semibold text-gray-400">
                Collection
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Pet House
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Inventory
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Cosmetic Rarity
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Profile Borders
              </li>
            </ul>
            <ul className="col-span-1 px-4 space-y-2">
              <li className="uppercase font-semibold text-gray-400">
                Community
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Challenge Reviews
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Report System
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Team Chat
              </li>
            </ul>
            <ul className="col-span-1 px-4 space-y-2">
              <li className="uppercase font-semibold text-gray-400">The Lab</li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Daily Quests
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                AI Challenge Gen
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Code Optimization
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Bug Hunting
              </li>
            </ul>
            <ul className="col-span-1 px-4 space-y-2">
              <li className="uppercase font-semibold text-gray-400">Project</li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Meet Dusk&Dawn
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Technical Diagrams
              </li>
              <li className="hover:underline hover:text-primary cursor-pointer">
                Esprit 2026
              </li>
            </ul>
          </div>
          <div className="flex  gap-4 justify-between p-6 md:p-12 md:pb-24 relative">
            <div className="absolute w-fit inset-x-0 mx-auto">
              2026 - All rights reserved
            </div>
            <div className="flex w-full justify-between mt-8 lg:mt-0">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setTheme(theme == 'light' ? 'dark' : 'light')}
              >
                {theme == 'dark' ? <Moon /> : <Sun />}
              </Button>
              <div className="flex items-center gap-2 text-sm bg-secondary px-4 rounded-4xl">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-primary animate-ping absolute" />
                  <div className="w-3 h-3 rounded-full bg-primary relative" />
                </div>
                <p>ENGINE STATUS: LOCKING IN...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

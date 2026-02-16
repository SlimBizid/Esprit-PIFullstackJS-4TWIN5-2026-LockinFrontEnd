import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes"

export default function Navbar(){
      const { theme, setTheme } = useTheme();

    return <div className="text-center bg-background min-h-screen select-none">
      <div className="bg-secondary py-2 px-4 flex justify-between items-center">
        <p className="font-black text-lg">LockIN</p>
        <ul className="flex gap-2 font-semibold h-full ">
          <li className=" hover:text-slate-500 select-none cursor-pointer">
            Home
          </li>
          <li className=" hover:text-slate-500 select-none cursor-pointer">
            Leaderboard
          </li>
          <li className=" hover:text-slate-500 select-none cursor-pointer">
            Challenges
          </li>
        </ul>
        <div className="flex gap-2">
          <Button size="icon" onClick={()=> setTheme(theme == "light"? "dark" : "light")}>{theme == "dark" ? <Moon /> : <Sun />}</Button>
          <Button variant={'secondary'}>Sign Up</Button>
          <Button>Finish</Button>
        </div>
      </div>
    </div>
}
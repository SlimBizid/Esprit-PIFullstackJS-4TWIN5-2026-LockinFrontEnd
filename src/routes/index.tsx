import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center bg-neutral-200 min-h-screen select-none">
      <div className="bg-white py-2 px-4 flex justify-between items-center">
        <p className="font-black text-lg">Logo</p>
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
          <Button variant={'secondary'}>Sign Up</Button>
          <Button>Finish</Button>
        </div>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFileRoute, Link } from '@tanstack/react-router'
import LogInCover from '@/../public/LogInCover.png'

export const Route = createFileRoute('/auth/register')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="w-full h-full p-20">
      <div className="rounded-md overflow-hidden grid grid-cols-2">
        <img
          src={LogInCover}
          alt=""
          className="col-span-1 w-full h-full object-cover select-none"
        />
        <div className="h-full col-span-1 text-center flex flex-col gap-8 px-20 py-16 bg-accent">
          <div className="gap-4 flex flex-col select-none">
            <p className="text-5xl font-mono-one">Happy To Have You</p>
            <p>Build your new coding habit with LockIN</p>
          </div>
          <div className="flex flex-col gap-4">
            <Input placeholder="Username" />
            <Input placeholder="Email" />
            <div className="flex flex-col gap-2 items-end hover:underline">
              <Input placeholder="Password" type="password" />
              <Input placeholder="Confirm Password" type="password" />
              <Link to="/auth/login" className="font-semibold select-none">
                Already have an account?
              </Link>
            </div>
            <div></div>
          </div>
          <Button>Sign Up</Button>
          <div className="grid grid-cols-3 items-center">
            <div className="col-span-1 border-primary border-b h-0"></div>
            <p className="font-semibold">Or continue</p>
            <div className="col-span-1 border-primary border-b h-0"></div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary">Using Github</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Github, UserCircle, Terminal, Lock } from 'lucide-react'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-80 py-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="relative w-full group">
        <div className="relative flex flex-col gap-8 px-10 py-12 bg-background border-border border rounded-lg shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-2 text-center select-none">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase text-foreground font-mono">
              Initialize <span className="text-primary">Session</span>
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
              LockIn // Your key to focus
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="USERNAME / EMAIL"
                  className="bg-background border-border/50 focus:border-primary transition-colors pl-10 h-11 text-xs font-mono uppercase tracking-widest"
                />
                <UserCircle className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="ACCESS KEY"
                    type="password"
                    className="bg-background border-border/50 focus:border-primary transition-colors pl-10 h-11 text-xs font-mono tracking-[0.3em]"
                  />
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex justify-end">
                  <Link
                    to="/auth/forgot-password"
                    className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors tracking-tighter"
                  >
                    Forgot Access Key?
                  </Link>
                </div>
              </div>
            </div>

            <Button className="w-full h-11 bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] font-bold uppercase tracking-widest text-xs transition-all">
              Authorize Login
            </Button>

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-border"></div>
              <span className="shrink mx-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Alternate Uplink
              </span>
              <div className="grow border-t border-border"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-10 border-border/50 hover:bg-primary/5 text-[10px] font-bold uppercase tracking-tight gap-2"
              >
                <Github className="w-4 h-4" /> Github
              </Button>
              <Button
                variant="outline"
                className="h-10 border-border/50 hover:bg-primary/5 text-[10px] font-bold uppercase tracking-tight gap-2"
              >
                As Guest
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-6 border-t border-border/30 text-center">
            <Link
              to="/auth/register"
              className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest"
            >
              Don't have an account?{' '}
              <span className="text-primary underline underline-offset-4">
                Register
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

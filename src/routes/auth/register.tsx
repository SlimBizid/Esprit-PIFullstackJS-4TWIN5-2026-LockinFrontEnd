import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Github,
  UserPlus,
  Mail,
  ShieldCheck,
  Cpu,
  KeyRound,
} from 'lucide-react'

export const Route = createFileRoute('/auth/register')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-80 py-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className=" relative flex flex-col gap-8 px-8 py-10 bg-background border-border border rounded-xl shadow-2xl w-full">
        <div className="flex flex-col gap-4 text-center select-none">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/5 border border-primary/20">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase text-foreground font-mono">
            Create <span className="text-primary text-glow">Identifier</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium">
            LockIn // New Recruit Onboarding
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4">
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <UserPlus className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                placeholder="CHOOSE ALIAS"
                className="bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pl-10 h-12 text-[11px] font-mono uppercase tracking-widest"
              />
            </div>

            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                placeholder="UPLINK EMAIL"
                className="bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all pl-10 h-12 text-[11px] font-mono uppercase tracking-widest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  placeholder="ACCESS KEY"
                  type="password"
                  className="bg-muted/20 border-border/50 focus:border-primary/50 transition-all pl-10 h-12 text-[11px] font-mono tracking-[0.2em]"
                />
              </div>
              <div className="group relative">
                <Input
                  placeholder="VERIFY KEY"
                  type="password"
                  className="bg-muted/20 border-border/50 focus:border-primary/50 transition-all h-12 text-[11px] font-mono tracking-[0.2em]"
                />
              </div>
            </div>
          </div>

          <Button className="w-full h-12 bg-primary text-primary-foreground hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] font-bold uppercase tracking-[0.2em] text-[11px] transition-all group">
            <ShieldCheck className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Initialize Profile
          </Button>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-border/50"></div>
            <span className="shrink mx-4 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              Fast Uplink
            </span>
            <div className="grow border-t border-border/50"></div>
          </div>

          <Button
            variant="outline"
            className="h-11 border-border/50 bg-muted/5 hover:bg-primary/5 hover:border-primary/30 text-[10px] font-bold uppercase tracking-widest gap-2 transition-all"
          >
            <Github className="w-4 h-4" /> Register with Github
          </Button>
        </div>

        <div className="mt-4 pt-6 border-t border-border/30 text-center">
          <Link
            to="/auth/login"
            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest"
          >
            Already Registered?{' '}
            <span className="text-primary underline underline-offset-4">
              Log In
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

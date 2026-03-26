import { createFileRoute } from '@tanstack/react-router'
import { Terminal } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

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

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'
import { AuthShell } from '@/components/auth/AuthShell'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthShell
      heading="Welcome back."
      subheading="Sign in to keep your streak alive."
    >
      <LoginForm />
    </AuthShell>
  )
}

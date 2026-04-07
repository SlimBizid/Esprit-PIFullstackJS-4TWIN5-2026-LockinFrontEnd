import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthShell } from '@/components/auth/AuthShell'

export const Route = createFileRoute('/auth/register')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthShell
      heading="Join the grind."
      subheading="Create your account and start locking in."
    >
      <RegisterForm />
    </AuthShell>
  )
}

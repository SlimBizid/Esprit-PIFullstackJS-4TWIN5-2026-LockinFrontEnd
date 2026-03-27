import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthShell } from '@/components/auth/AuthShell'

export const Route = createFileRoute('/auth/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthShell
      heading="Reset access."
      subheading="We'll send a recovery link to your email."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '@/stores/userStore'
import { useId } from 'react'
import { ArrowLeft, MailCheck } from 'lucide-react'

type ForgotPasswordValues = {
  email: string
}

export function ForgotPasswordForm() {
  const uid = useId()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>()

  const mutation = useMutation({
    mutationFn: async (values: ForgotPasswordValues) => {
      await api.post('/auth/forgot-password', values)
    },
    onError: (error) => {
      console.error('Reset request failed', error)
    },
  })

  const onSubmit = (values: ForgotPasswordValues) => mutation.mutate(values)

  const isPending = mutation.isPending || isSubmitting

  if (mutation.isSuccess) {
    return (
      <div role="status" aria-live="polite" className="space-y-6">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <MailCheck className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-lg">
              Check your inbox
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              We've sent a recovery link to{' '}
              <strong className="text-foreground">{getValues('email')}</strong>.
              It may take a minute to arrive.
            </p>
          </div>
        </div>

        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-sm font-medium
                     text-muted-foreground hover:text-foreground transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     focus-visible:ring-offset-2 rounded-sm"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Forgot password form"
      className="space-y-5"
    >
      {mutation.isError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Something went wrong. Please try again in a moment.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-email`} className="text-sm font-medium">
          Email address
        </Label>
        <Input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={
            errors.email ? `${uid}-email-err` : `${uid}-email-hint`
          }
          {...register('email', {
            required: 'Please enter your email address.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address.',
            },
          })}
          className="h-11"
          placeholder="you@example.com"
        />
        {errors.email ? (
          <p
            id={`${uid}-email-err`}
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.email.message}
          </p>
        ) : (
          <p id={`${uid}-email-hint`} className="text-xs text-muted-foreground">
            We'll send a one-time reset link to this address.
          </p>
        )}

        <h2 className="text-center font-semibold mt-4">or</h2>
        <Label htmlFor={`${uid}-emaill`} className="text-sm font-medium">
          Phone number
        </Label>
        <Input
          id={`${uid}-emaill`}
          type="text"
          aria-invalid={!!errors.email}
          aria-describedby={
            errors.email ? `${uid}-email-err` : `${uid}-email-hint`
          }
          {...register('email', {
            required: 'Please enter your email address.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address.',
            },
          })}
          className="h-11"
          placeholder="98988988"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full h-11 font-semibold"
      >
        {isPending ? 'Sending…' : 'Send reset link'}
      </Button>

      <Link
        to="/auth/login"
        className="flex items-center justify-center gap-2 text-sm font-medium
                   text-muted-foreground hover:text-foreground transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   focus-visible:ring-offset-2 rounded-sm"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </form>
  )
}

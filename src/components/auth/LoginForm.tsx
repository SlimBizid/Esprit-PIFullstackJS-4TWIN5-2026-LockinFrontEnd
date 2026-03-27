import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useNavigate } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api, useUserStore } from '@/stores/userStore'
import type { User } from '@/models/user'
import { useId } from 'react'

type LoginFormValues = {
  username: string
  password: string
}

export function LoginForm() {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)
  const uid = useId()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>()

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { data } = await api.post<User>('/auth/login', values)
      return data
    },
    onError: (error) => {
      console.error('Login failed', error)
    },
    onSuccess: (user) => {
      setUser(user)
      navigate({ to: '/' })
    },
  })

  const onSubmit = (values: LoginFormValues) => loginMutation.mutate(values)

  const isPending = loginMutation.isPending || isSubmitting

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Sign in form"
      className="space-y-5"
    >
      {/* ── Server error ── */}
      {loginMutation.isError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Incorrect username or password. Please try again.
        </div>
      )}

      {/* ── Username ── */}
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-username`} className="text-sm font-medium">
          Username or email
        </Label>
        <Input
          id={`${uid}-username`}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? `${uid}-username-err` : undefined}
          {...register('username', {
            required: 'Please enter your username or email.',
          })}
          className="h-11"
          placeholder="you@example.com"
        />
        {errors.username && (
          <p
            id={`${uid}-username-err`}
            role="alert"
            className="text-xs text-destructive mt-1"
          >
            {errors.username.message}
          </p>
        )}
      </div>

      {/* ── Password ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${uid}-password`} className="text-sm font-medium">
            Password
          </Label>
          <Link
            to="/auth/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                       focus-visible:ring-offset-2 rounded-sm"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id={`${uid}-password`}
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? `${uid}-password-err` : undefined}
          {...register('password', { required: 'Please enter your password.' })}
          className="h-11"
          placeholder="••••••••"
        />
        {errors.password && (
          <p
            id={`${uid}-password-err`}
            role="alert"
            className="text-xs text-destructive mt-1"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full h-11 font-semibold"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      {/* ── Divider ── */}
      <div className="relative flex items-center py-1">
        <div className="grow border-t border-border" />
        <span className="mx-4 shrink text-xs text-muted-foreground">
          or continue with
        </span>
        <div className="grow border-t border-border" />
      </div>

      {/* ── Social / Guest ── */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Sign in with GitHub"
        >
          <Github className="w-4 h-4" aria-hidden="true" />
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Continue as guest
        </Button>
      </div>

      {/* ── Register link ── */}
      <p className="pt-2 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link
          to="/auth/register"
          className="font-semibold text-foreground underline underline-offset-4
                     hover:text-primary transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     focus-visible:ring-offset-2 rounded-sm"
        >
          Create one
        </Link>
      </p>
    </form>
  )
}

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
import axios from 'axios'

type RegisterFormValues = {
  username: string
  email: string
  password: string
  confirmPassword: string
}

type RegisterResult = {
  user: User | null
}

function getErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Registration failed. Please try again.'
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return 'Registration failed. Please try again.'
}

export function RegisterForm() {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)
  const uid = useId()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>()

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const { data } = await api.post<User>('/auth/signup', {
        username: values.username,
        email: values.email,
        password: values.password,
      })

      try {
        const { data } = await api.post<User>('/auth/login', {
          username: values.username,
          password: values.password,
        })

        return { user: data }
      } catch (error) {
        console.error('Auto-login after registration failed', error)
        return { user: null }
      }
    },
    onError: (error) => {
      console.error('Registration failed', error)
    },
    onSuccess: ({ user }) => {
      if (user) {
        setUser(user)
        navigate({ to: '/' })
        return
      }

      navigate({ to: '/auth/login' })
    },
  })

  const onSubmit = (values: RegisterFormValues) =>
    registerMutation.mutate(values)

  const isPending = registerMutation.isPending || isSubmitting
  const passwordValue = watch('password')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Create account form"
      className="space-y-5"
    >
      {registerMutation.isError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {getErrorMessage(registerMutation.error)}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-username`} className="text-sm font-medium">
          Username
        </Label>
        <Input
          id={`${uid}-username`}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={!!errors.username}
          aria-describedby={
            errors.username ? `${uid}-username-err` : `${uid}-username-hint`
          }
          {...register('username', {
            required: 'Please choose a username.',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters.',
            },
            maxLength: {
              value: 30,
              message: 'Username must be 30 characters or fewer.',
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message:
                'Only letters, numbers, hyphens, and underscores allowed.',
            },
          })}
          className="h-11"
          placeholder="your_handle"
        />
        {errors.username ? (
          <p
            id={`${uid}-username-err`}
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.username.message}
          </p>
        ) : (
          <p
            id={`${uid}-username-hint`}
            className="text-xs text-muted-foreground"
          >
            Letters, numbers, hyphens, and underscores only.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-email`} className="text-sm font-medium">
          Email
        </Label>
        <Input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${uid}-email-err` : undefined}
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
        {errors.email && (
          <p
            id={`${uid}-email-err`}
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-password`} className="text-sm font-medium">
            Password
          </Label>
          <Input
            id={`${uid}-password`}
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? `${uid}-password-err` : `${uid}-password-hint`
            }
            {...register('password', {
              required: 'Please create a password.',
              minLength: {
                value: 8,
                message: 'At least 8 characters required.',
              },
            })}
            className="h-11"
            placeholder="••••••••"
          />
          {errors.password ? (
            <p
              id={`${uid}-password-err`}
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password.message}
            </p>
          ) : (
            <p
              id={`${uid}-password-hint`}
              className="text-xs text-muted-foreground"
            >
              Min. 8 characters.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-confirm`} className="text-sm font-medium">
            Confirm password
          </Label>
          <Input
            id={`${uid}-confirm`}
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? `${uid}-confirm-err` : undefined
            }
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: (val) =>
                val === passwordValue || 'Passwords do not match.',
            })}
            className="h-11"
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p
              id={`${uid}-confirm-err`}
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full h-11 font-semibold"
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <div className="relative flex items-center py-1">
        <div className="grow border-t border-border" />
        <span className="mx-4 shrink text-xs text-muted-foreground">
          or sign up with
        </span>
        <div className="grow border-t border-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Sign up with GitHub"
      >
        <Github className="w-4 h-4" aria-hidden="true" />
        Continue with GitHub
      </Button>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="font-semibold text-foreground underline underline-offset-4
                     hover:text-primary transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     focus-visible:ring-offset-2 rounded-sm"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}

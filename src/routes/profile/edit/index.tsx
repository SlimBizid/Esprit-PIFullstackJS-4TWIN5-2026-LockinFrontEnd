import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/api-error'
import { api, useUser, useUserStore } from '@/stores/userStore'

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or fewer')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Only letters, numbers, hyphens, and underscores allowed',
    ),
  email: z.email('Invalid email address'),
  githubHandle: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const Route = createFileRoute('/profile/edit/')({
  component: EditProfilePage,
  loader: async () => {
    const user = useUserStore.getState().user
    if (!user) {
      throw redirect({ to: '/' })
    }
  },
})

type UpdateUserFormValues = z.infer<typeof updateUserSchema>

export function EditProfilePage() {
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState(false)
  const user = useUser()
  const userStore = useUserStore()

  if (!user) {
    throw redirect({ to: '/auth/login' })
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: standardSchemaResolver(updateUserSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      githubHandle: user.githubHandle || '',
      password: '',
    },
  })

  const onSubmit = async (values: UpdateUserFormValues) => {
    try {
      await api.patch('/users/edit', values)
      setApiError(null)
      await userStore.fetchMe()
      setSuccessMessage(true)
    } catch (err) {
      setSuccessMessage(false)
      setApiError(getApiErrorMessage(err, 'Failed to update profile. Try again.'))
    }
  }

  const goBack = () => {
    window.history.back()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <h1 className="text-4xl font-bold">Edit Profile</h1>
      </div>

      <div
        role={apiError ? 'alert' : 'status'}
        aria-live="polite"
        className={`mb-4 min-h-[3rem] rounded-lg border px-4 py-3 text-sm transition-colors duration-150 ${
          apiError
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : successMessage
              ? 'border-emerald-400 bg-primary/20 text-foreground'
              : 'border-transparent bg-transparent text-foreground'
        }`}
      >
        {apiError && <p>{apiError}</p>}
        {successMessage && (
          <>
            <p className="mb-1">Profile updated successfully!</p>
            <p>
              <Link
                to="/profile/$userId"
                params={{ userId: user.username }}
                className="font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Go back to your profile
              </Link>
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            {...register('username')}
            aria-invalid={!!errors.username}
            placeholder="your_handle"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            placeholder="you@example.com"
            disabled={!!user.githubHandle}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Confirm Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            aria-invalid={!!errors.password}
            placeholder="********"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {!user.githubHandle && (
            <Button asChild variant="outline" className="h-11 w-full sm:flex-1">
              <Link to="/profile/edit/password">Update Password</Link>
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="h-11 w-full sm:flex-1"
          >
            {isSubmitting ? 'Updating...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}

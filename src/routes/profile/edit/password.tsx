import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/api-error'
import { api, useUser, useUserStore } from '@/stores/userStore'

const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Current password must be at least 8 characters'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'New passwords do not match',
  })

export const Route = createFileRoute('/profile/edit/password')({
  component: UpdatePasswordPage,
  loader: async () => {
    const user = useUserStore.getState().user
    if (!user) {
      throw redirect({ to: '/' })
    }
  },
})

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

export function UpdatePasswordPage() {
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const user = useUser()

  if (!user) {
    throw redirect({ to: '/auth/login' })
  }

  if (user.githubHandle) {
    throw redirect({ to: '/profile/edit' })
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: standardSchemaResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    try {
      const { data } = await api.patch<{ message?: string }>(
        '/users/me/password',
        values,
      )
      setApiError(null)
      setSuccessMessage(data.message ?? 'Password updated successfully.')
      reset()
    } catch (err) {
      setSuccessMessage(null)
      setApiError(getApiErrorMessage(err, 'Failed to update password. Try again.'))
    }
  }

  const goBack = () => {
    window.history.back()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
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
        <h1 className="text-4xl font-bold">Update Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your current password, then choose a new one.
        </p>
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
        {successMessage && <p>{successMessage}</p>}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Update password form"
        className="space-y-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
            aria-invalid={!!errors.currentPassword}
            placeholder="********"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            aria-invalid={!!errors.newPassword}
            placeholder="********"
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            placeholder="********"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="h-11 w-full font-semibold"
        >
          {isSubmitting ? 'Updating password...' : 'Save New Password'}
        </Button>
      </form>
    </div>
  )
}

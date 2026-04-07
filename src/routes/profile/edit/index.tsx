import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, useUser, useUserStore } from '@/stores/userStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: user?.username,
      email: user?.email,
      githubHandle: user?.githubHandle || '',
      password: '',
    },
  })

  const onSubmit = async (values: UpdateUserFormValues) => {
    try {
      await api.patch('/users/edit', values)
      setApiError(null)
      await userStore.fetchMe()
      setSuccessMessage(true)
    } catch (err: any) {
      setSuccessMessage(false)
      setApiError(
        err.response?.data?.message || 'Failed to update profile. Try again.',
      )
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8">Edit Profile</h1>

      {/* API Feedback */}
      <div
        role={apiError ? 'alert' : 'status'}
        aria-live="polite"
        className={`mb-4 rounded-lg border px-4 py-3 text-sm transition-colors duration-150 min-h-[3rem] ${
          apiError
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : successMessage
              ? 'border-emerald-400 bg-primary/20 text-foreground'
              : 'border-transparent bg-transparent text-foreground'
        }`}
      >
        {apiError && <p className="mb-0">{apiError}</p>}
        {successMessage && (
          <>
            <p className="mb-1">Profile updated successfully!</p>
            <p className="mb-0">
              <Link
                to="/profile/$userId"
                params={{ userId: user?.username ?? '' }}
                className="font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Go back to your profile
              </Link>
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            {...register('username')}
            aria-invalid={!!errors.username}
            placeholder="your_handle"
          />
          {errors.username && (
            <p className="text-xs text-destructive mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* GitHub Handle */}
        <div className="space-y-1.5">
          <Label htmlFor="githubHandle">GitHub Handle</Label>
          <Input
            id="githubHandle"
            {...register('githubHandle')}
            aria-invalid={!!errors.githubHandle}
            placeholder="your_github"
          />
          {errors.githubHandle && (
            <p className="text-xs text-destructive mt-1">
              {errors.githubHandle.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Confirm Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            aria-invalid={!!errors.password}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-destructive mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full h-11 font-semibold"
        >
          {isSubmitting ? 'Updating…' : 'Update Profile'}
        </Button>
      </form>
    </div>
  )
}

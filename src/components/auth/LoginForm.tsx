import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from '@tanstack/react-router'
import { Github, UserCircle, Lock } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api, useUserStore } from '@/stores/userStore'
import type { User } from '@/models/user'

type LoginFormValues = {
  username: string
  password: string
}

export function LoginForm() {
  const navigate = useNavigate()
  const setUser = useUserStore((s) => s.setUser)

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
      console.log(error)
    },
    onSuccess: (user) => {
      setUser(user)
      navigate({ to: '/' })
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="USERNAME / EMAIL"
            {...register('username', {
              required: 'Email is required',
            })}
            className="bg-background border-border/50 focus:border-primary transition-colors pl-10 h-11 text-xs font-mono uppercase tracking-widest"
          />
          <UserCircle className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          {errors.username && (
            <p className="text-xs text-red-500 mt-1">
              {errors.username.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="password"
              placeholder="ACCESS KEY"
              {...register('password', {
                required: 'Password is required',
              })}
              className="bg-background border-border/50 focus:border-primary transition-colors pl-10 h-11 text-xs font-mono tracking-[0.3em]"
            />
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors tracking-tighter"
            >
              Forgot Access Key?
            </Link>
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <Button
        type="submit"
        disabled={loginMutation.isPending || isSubmitting}
        className="w-full h-11 bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,207,186,0.4)] font-bold uppercase tracking-widest text-xs transition-all"
      >
        {loginMutation.isPending ? 'Authorizing...' : 'Authorize Login'}
      </Button>

      {/* SERVER ERROR */}
      {loginMutation.isError && (
        <p className="text-xs text-red-500 text-center">
          Login failed. Check credentials.
        </p>
      )}

      {/* DIVIDER */}
      <div className="relative flex items-center py-2">
        <div className="grow border-t border-border"></div>
        <span className="shrink mx-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Alternate Uplink
        </span>
        <div className="grow border-t border-border"></div>
      </div>

      {/* SOCIAL / GUEST */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 border-border/50 hover:bg-primary/5 text-[10px] font-bold uppercase tracking-tight gap-2"
        >
          <Github className="w-4 h-4" /> Github
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-10 border-border/50 hover:bg-primary/5 text-[10px] font-bold uppercase tracking-tight gap-2"
        >
          As Guest
        </Button>
      </div>

      {/* REGISTER */}
      <div className="mt-4 pt-6 border-t border-border/30 text-center">
        <Link
          to="/auth/register"
          className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors tracking-widest"
        >
          Don't have an account?{' '}
          <span className="text-primary underline underline-offset-4">
            Register
          </span>
        </Link>
      </div>
    </form>
  )
}

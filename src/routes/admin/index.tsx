import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AlertCircle, Shield, Users } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, useIsAdmin } from '@/stores/userStore'

type AdminUser = {
  id: string
  username: string
  email: string
  githubHandle: string | null
  type: 'admin' | 'player'
  createdAt: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  if (error.response?.status === 401) return 'You must be logged in.'
  if (error.response?.status === 403)
    return 'You do not have permission to view admin tools.'

  return fallback
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const isAdmin = useIsAdmin()

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get('/users', {
        params: { page: 1, limit: 100 },
      })

      return data as {
        data: AdminUser[]
        total: number
        page: number
        lastPage: number
      }
    },
  })

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 pb-16 pt-28">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Admin Only</AlertTitle>
          <AlertDescription>
            Admin tools are only available to admins.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-16 pt-28">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline">Admin hub</Badge>
          <h1 className="text-3xl font-black tracking-tight">
            Admin Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Review platform users and jump to the rest of the admin tools from
            one place.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              Recent users returned by the protected <code>/users</code>{' '}
              endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="py-6 text-sm text-muted-foreground">
                Loading users...
              </div>
            ) : usersQuery.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to load users</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(usersQuery.error, 'Unable to fetch users.')}
                </AlertDescription>
              </Alert>
            ) : (usersQuery.data?.data.length ?? 0) === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">
                No users found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data?.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.githubHandle || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.type === 'admin' ? 'default' : 'secondary'
                          }
                        >
                          {user.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Pages
            </CardTitle>
            <CardDescription>
              Open the other moderation and content-management screens.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="justify-start">
              <Link to="/admin/review-reports">Review reports</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/achievements/new">Create achievement</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/challenges">Manage challenges</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/cosmetics">Manage cosmetics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

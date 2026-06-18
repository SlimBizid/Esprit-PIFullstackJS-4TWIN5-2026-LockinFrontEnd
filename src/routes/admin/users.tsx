import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { User } from '@/models/user'
import { api, useIsAdmin } from '@/stores/userStore'

type UsersResponse = {
  data: User[]
  total: number
  page: number
  lastPage: number
}

export const Route = createFileRoute('/admin/users')({
  component: RouteComponent,
})

function RouteComponent() {
  const isAdmin = useIsAdmin()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 10

  const usersQuery = useQuery({
    queryKey: ['admin-users', page, search],
    enabled: isAdmin,
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit }
      if (search) params.search = search
      const { data } = await api.get<UsersResponse>('/users', { params })
      return data
    },
  })

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 pb-16 pt-28">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Admin Only</AlertTitle>
          <AlertDescription>
            User management is only available to admins.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-16 pt-28">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline">Admin management</Badge>
          <h1 className="text-3xl font-black tracking-tight">Users</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            View and manage all users, including soft-deleted and blocked
            accounts.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>

      <Input
        placeholder="Search by username..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        className="max-w-sm"
      />

      {usersQuery.isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Loading users...
          </CardContent>
        </Card>
      ) : usersQuery.data?.data.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No users found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data?.data.map((user) => (
                    <TableRow
                      key={user.id}
                      className={
                        (user as any).deletedAt ? 'opacity-50' : undefined
                      }
                    >
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.githubHandle || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.type === 'admin' ? 'default' : 'secondary'
                          }
                        >
                          {user.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.xp}</TableCell>
                      <TableCell>
                        {(user as any).deletedAt ? (
                          <Badge variant="destructive">Deleted</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                        }).format(new Date(user.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {usersQuery.data?.total} user(s) total — page {page} of{' '}
              {usersQuery.data?.lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (usersQuery.data?.lastPage ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

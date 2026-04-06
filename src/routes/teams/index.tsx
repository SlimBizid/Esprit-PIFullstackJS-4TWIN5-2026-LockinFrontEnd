import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState, useRef } from 'react'

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Flame } from 'lucide-react'

// Zustand
import {
  useTeamStore,
  useTeams,
  useAllTeams,
  useTeamLoading,
} from '@/stores/teamStore'
import { useUser } from '@/stores/userStore'

export const Route = createFileRoute('/teams/')({
  component: TeamsRoute,
})

export function TeamsRoute() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Zustand state
  const { fetchTeams, fetchMyTeams, createTeam } = useTeamStore()
  const myTeams = useTeams()       // Only user’s teams
  const allTeams = useAllTeams()   // All teams (for Explore + Invites)
  const loading = useTeamLoading()
  const user = useUser()

  // UI state
  const [tab, setTab] = useState<'myTeams' | 'invites'>('myTeams')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL')
  const [showAddTeamForm, setShowAddTeamForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')

  // Fetch data on mount
  useEffect(() => {
    fetchTeams()     // fetch all teams
    fetchMyTeams()   // fetch teams where user is a member
  }, [])

  // Auto scroll for Explore Teams
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let direction = 1
    const speed = 0.5

    const step = () => {
      if (!container) return
      container.scrollLeft += speed * direction

      if (container.scrollLeft + container.clientWidth >= container.scrollWidth)
        direction = -1
      if (container.scrollLeft <= 0) direction = 1

      requestAnimationFrame(step)
    }

    const anim = requestAnimationFrame(step)
    return () => cancelAnimationFrame(anim)
  }, [allTeams])

  // Filtered teams for My Teams / Invites
  const filteredTeams = useMemo(() => {
    if (!user) return []

    if (tab === 'myTeams') {
      let filtered = myTeams
      // Apply status filter
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter(t => t.status === statusFilter)
      }
      // Apply search filter
      if (search) {
        filtered = filtered.filter(t =>
          t.name?.toLowerCase().includes(search.toLowerCase())
        )
      }
      return filtered
    }

    if (tab === 'invites') {
      if (!allTeams) return []
      let invites = allTeams.filter(t => t.pendingInvitations?.includes(user.id))
      // Apply search filter
      if (search) {
        invites = invites.filter(t =>
          t.name?.toLowerCase().includes(search.toLowerCase())
        )
      }
      return invites
    }

    return []
  }, [myTeams, allTeams, tab, search, statusFilter, user])

  // Create new team
  const handleAddTeam = async () => {
    if (!newTeamName || !user) return
    try {
      await createTeam(newTeamName, user.id)
      setNewTeamName('')
      setShowAddTeamForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Explore Teams */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Explore Teams
          </h2>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
          >
            {allTeams.map(team => {
              const leader = team.users?.[0]?.username 

              return (
                <div
                  key={team.id}
                  onClick={() =>
                    navigate({ to: '/teams/$teamId', params: { teamId: String(team.id) } })
                  }
                  className="group border hover:shadow-xl cursor-pointer flex-shrink-0 min-w-[300px]"
                >
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="h-16 w-16 flex items-center justify-center border relative">
                        <Flame className="opacity-20 absolute w-full h-full" />
                        <span className="text-xl z-10">{team.users?.length || 0}</span>
                      </div>

                      <div>
                        <Badge className="mb-1 text-xs">Public</Badge>
                        <h2 className="text-lg font-semibold">{team.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {team.users?.length || 0} Members • Leader: {leader}
                        </p>
                      </div>
                    </div>

                    <Button size="sm">View</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Header: Search + Status Filter + Add Team */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Teams Dashboard</h1>

          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {tab === 'myTeams' && (
              <select
                className="border rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'PENDING')
                }
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
              </select>
            )}

            <Button onClick={() => setShowAddTeamForm(true)}>Add Team</Button>
          </div>
        </div>

        {/* Add Team Modal */}
        {showAddTeamForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <Card className="p-6 w-96">
              <h2 className="text-lg font-bold mb-4">Create Team</h2>

              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                className="mb-4"
              />

              <Button onClick={handleAddTeam} className="w-full mb-2">
                Create
              </Button>

              <Button
                variant="destructive"
                onClick={() => setShowAddTeamForm(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="myTeams">My Teams</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Teams Table */}
        <Card>
          <CardContent>
            {loading ? (
              <div className="text-center p-6">Loading...</div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                {tab === 'myTeams'
                  ? 'You have no teams yet'
                  : 'You have no invitations yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredTeams.map((t) => {
                    const leader = t.users?.[0]?.username || 'N/A'
                    return (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate({ to: '/teams/$teamId', params: { teamId: String(t.id) } })
                        }
                      >
                        <TableCell>{t.name}</TableCell>
                        <TableCell>{leader}</TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {t.users?.slice(0, 3).map((m: any) => (
                              <Avatar key={m.id}>
                                <AvatarFallback>
                                  {m.username?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{t.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

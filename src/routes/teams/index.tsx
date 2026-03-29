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
                    import { Search, Flame, Mail, MessageCircle } from 'lucide-react'

                    export const Route = createFileRoute('/teams/')({
                      component: TeamsRoute,
                    })

                    export function TeamsRoute() {
                      const navigate = useNavigate()
                      const scrollRef = useRef<HTMLDivElement>(null)
                      const [teams, setTeams] = useState<any[]>([])
                      const [invitations, setInvitations] = useState<any[]>([])
                      const [globalTeams, setGlobalTeams] = useState<any[]>([])
                      const [tab, setTab] = useState<'myTeams' | 'pending' | 'invites'>('myTeams')
                      const [search, setSearch] = useState('')
                      const [loading, setLoading] = useState(false)
                      const [showAddTeamForm, setShowAddTeamForm] = useState(false)
                      const [newTeamName, setNewTeamName] = useState('')

                      useEffect(() => {
                        setLoading(true)
                        setTimeout(() => {
                          const fakeUsers = [
                            { id: 'u1', name: 'Salma' },
                            { id: 'u2', name: 'Ali' },
                            { id: 'u3', name: 'Sara' },
                            { id: 'u4', name: 'Omar' },
                            { id: 'u5', name: 'Lina' },
                          ]
                          const fakeTeams = [
                            {
                              id: 1,
                              name: 'Frontend Ninjas',
                              leaderId: 'Salma',
                              status: 'ACTIVE',
                              users: [fakeUsers[0], fakeUsers[1], fakeUsers[2]],
                              pendingInvitations: ['u4'],
                            },
                            {
                              id: 2,
                              name: 'Backend Squad',
                              leaderId: 'Ali',
                              status: 'PENDING',
                              users: [fakeUsers[1]],
                              pendingInvitations: ['u3', 'u5'],
                            },
                            {
                              id: 3,
                              name: 'AI Legends',
                              leaderId: 'Omar',
                              status: 'ACTIVE',
                              users: [fakeUsers[3], fakeUsers[4]],
                              pendingInvitations: [],
                            },
                          ]
                          setTeams(fakeTeams)
                          setGlobalTeams(fakeTeams)
                          setInvitations([
                            {
                              id: 1,
                              teamId: 2,
                              teamName: 'Backend Squad',
                              leaderId: 'Ali',
                              userId: 'u3',
                            },
                            {
                              id: 2,
                              teamId: 2,
                              teamName: 'Backend Squad',
                              leaderId: 'Ali',
                              userId: 'u5',
                            },
                          ])
                          setLoading(false)
                        }, 500)
                      }, [])

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
                      }, [globalTeams])

                      const filteredTeams = useMemo(() => {
                        return teams
                          .filter((t) =>
                            tab === 'myTeams'
                              ? t.status === 'ACTIVE'
                              : tab === 'pending'
                              ? t.status === 'PENDING'
                              : false,
                          )
                          .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
                      }, [teams, tab, search])

                      const acceptInvitation = (teamId: number, userId: string) => {
                        setInvitations((prev) => prev.filter((inv) => inv.userId !== userId))
                        setTeams((prev) =>
                          prev.map((t) => {
                            if (t.id === teamId) {
                              const user = { id: userId, name: 'Invited User' }
                              t.users.push(user)
                              if (t.users.length >= 3) t.status = 'ACTIVE'
                            }
                            return t
                          }),
                        )
                      }

                      const declineInvitation = (teamId: number, userId: string) => {
                        setInvitations((prev) => prev.filter((inv) => inv.userId !== userId))
                      }

                      const handleAddTeam = () => {
                        if (!newTeamName) return
                        const newTeam = {
                          id: globalTeams.length + 1,
                          name: newTeamName,
                          leaderId: 'Current User',
                          status: 'PENDING',
                          users: [{ id: 'u0', name: 'Current User' }],
                          pendingInvitations: [],
                        }
                        setGlobalTeams((prev) => [...prev, newTeam])
                        setNewTeamName('')
                        setShowAddTeamForm(false)
                      }

                      return (
                        <div className="min-h-screen bg-background pt-24 pb-12 px-6">
                          <div className="max-w-6xl mx-auto space-y-8">
                            <div className="space-y-4">
                              <h2 className="text-xl font-semibold tracking-wide text-muted-foreground">
                                Explore Teams
                              </h2>
                              <div
                                ref={scrollRef}
                                className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                              >
                                {globalTeams.map((team) => (
                                  <div
                                    key={team.id}
                                    onClick={() =>
                                      navigate({
                                        to: '/teams/$teamId',
                                        params: { teamId: String(team.id) },
                                      })
                                    }
                                    className="group relative overflow-hidden border border-primary/20 hover:shadow-2xl shadow-primary/5 transition-all cursor-pointer flex-shrink-0 min-w-[300px]"
                                  >
                                    <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative bg-background p-4 flex justify-between items-center gap-6">
                                      <div className="flex gap-6 items-center">
                                        <div className="h-20 w-20 bg-primary/10 flex items-center justify-center border border-primary/20 relative">
                                          <Flame className="text-primary w-full h-full animate-pulse opacity-10 absolute" />
                                          <span className="text-3xl opacity-60 z-10">
                                            {team.users.length}
                                          </span>
                                        </div>
                                        <div className="group-hover:text-primary transition">
                                          <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 uppercase tracking-widest text-[10px]">
                                            Public Team
                                          </Badge>
                                          <h2 className="text-2xl uppercase">{team.name}</h2>
                                          <p className="text-muted-foreground text-sm mt-1">
                                            {team.users.length} Members •{' '}
                                            <span className="text-primary">
                                              Leader: {team.leaderId}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                      <Button size="sm">View</Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
                              <h1 className="text-3xl font-bold tracking-wide">Teams Dashboard</h1>
                              <div className="flex items-center gap-2">
                                <div className="relative w-72">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search teams..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                                <Button onClick={() => setShowAddTeamForm(true)}>Add Team</Button>
                                <Button>
                                  <Mail className="w-5 h-5" />
                                </Button>
                                <Button>
                                  <MessageCircle className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>

                            {showAddTeamForm && (
                              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                <Card className="p-6 w-96">
                                  <h2 className="text-xl font-bold mb-4">Add New Team</h2>
                                  <Input
                                    placeholder="Team Name"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    className="mb-4"
                                  />
                                  <Button onClick={handleAddTeam} className="w-full mb-2">
                                    Create Team
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

                            <Tabs defaultValue={tab} onValueChange={(v) => setTab(v as any)}>
                              <TabsList className="grid grid-cols-3 w-full md:w-fit">
                                <TabsTrigger value="myTeams">My Teams</TabsTrigger>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="invites">Invitations</TabsTrigger>
                              </TabsList>
                            </Tabs>

                            <Card className="shadow-md border">
                              <CardContent className="p-0">
                                {loading ? (
                                  <div className="p-6 text-center text-muted-foreground">
                                    Loading...
                                  </div>
                                ) : tab === 'invites' ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Leader</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {invitations.map((inv) => (
                                        <TableRow key={inv.id}>
                                          <TableCell>{inv.teamName}</TableCell>
                                          <TableCell>{inv.leaderId}</TableCell>
                                          <TableCell className="text-right space-x-2">
                                            <Button size="sm" onClick={() => acceptInvitation(inv.teamId, inv.userId)}>
                                              Accept
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => declineInvitation(inv.teamId, inv.userId)}>
                                              Decline
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
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
                                      {filteredTeams.map((t) => (
                                        <TableRow
                                          key={t.id}
                                          className="cursor-pointer hover:bg-muted/50 transition"
                                          onClick={() =>
                                            navigate({
                                              to: '/teams/$teamId',
                                              params: { teamId: String(t.id) },
                                            })
                                          }
                                        >
                                          <TableCell>{t.name}</TableCell>
                                          <TableCell>{t.leaderId}</TableCell>
                                          <TableCell>
                                            <div className="flex -space-x-2">
                                              {t.users.slice(0, 3).map((m: any) => (
                                                <Avatar key={m.id} className="border">
                                                  <AvatarFallback>{m.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                              ))}
                                              {t.users.length > 3 && (
                                                <div className="text-xs bg-muted px-2 py-1 rounded-full ml-2">
                                                  +{t.users.length - 3}
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge className={t.status === 'ACTIVE' ? 'bg-primary text-white' : ''}>
                                              {t.status}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )
                    }

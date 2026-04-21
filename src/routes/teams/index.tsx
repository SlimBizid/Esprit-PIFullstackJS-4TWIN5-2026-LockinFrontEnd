import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState, useRef } from 'react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Users,
  ArrowRight,
  Search,
  Crown,
  Binoculars,
  Trophy,
} from 'lucide-react'

// Zustand
import {
  useTeamStore,
  useTeams,
  useAllTeams,
  useTeamLoading,
  useTeamMessage,
} from '@/stores/teamStore'
import { useUser } from '@/stores/userStore'

export const Route = createFileRoute('/teams/')({
  component: TeamsRoute,
})

const getPendingInvitationUserId = (invitation: any): string | undefined => {
  if (typeof invitation === 'string') return invitation
  return invitation?.userId ?? invitation?.user?.id
}

export function TeamsRoute() {
  const navigate = useNavigate()
  const activeTeamsRef = useRef<HTMLDivElement>(null)
  const allTeamsScrollRef = useRef<HTMLDivElement>(null)
  const { acceptInvitation, declineInvitation } = useTeamStore()

  // Zustand state
  const { fetchTeams, fetchMyTeams, createTeam } = useTeamStore()
  const clearTeamMessage = useTeamStore((s) => s.setMessage)
  const myTeams = useTeams() // Only user’s teams
  const allTeams = useAllTeams() // All teams (for Explore + Invites)
  const loading = useTeamLoading()
  const teamMessage = useTeamMessage()
  const user = useUser()
  const userId = user?.id ?? ''

  // UI state
  const [tab, setTab] = useState<'allTeams' | 'myTeams' | 'invites'>('allTeams')
  const [search, setSearch] = useState('')
  const [showAddTeamForm, setShowAddTeamForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')

  const featuredTeams = useMemo(() => allTeams.slice(0, 3), [allTeams])

  // Fetch data on mount
  useEffect(() => {
    fetchTeams() // fetch all teams
    fetchMyTeams() // fetch teams where user is a member
  }, [])

  // Auto-scroll only the All Teams list horizontally
  useEffect(() => {
    if (tab !== 'allTeams') return

    const container = allTeamsScrollRef.current
    if (!container) return

    let frameId = 0
    let direction = 1
    const speed = 0.6

    const step = () => {
      if (!container) return

      container.scrollLeft += speed * direction

      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth
      ) {
        direction = -1
      }

      if (container.scrollLeft <= 0) {
        direction = 1
      }

      frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [tab, allTeams.length, search])

  // Filtered teams for All Teams / My Teams / Invites
  const filteredTeams = useMemo(() => {
    if (!user) return []

    if (tab === 'allTeams') {
      let teams = allTeams
      if (search) {
        teams = teams.filter((t) =>
          t.name?.toLowerCase().includes(search.toLowerCase()),
        )
      }
      return teams
    }

    if (tab === 'myTeams') {
      return myTeams
    }

    if (tab === 'invites') {
      if (!allTeams) return []
      return allTeams.filter((t) =>
        (t.pendingInvitations ?? []).some(
          (invitation) => getPendingInvitationUserId(invitation) === user.id,
        ),
      )
    }

    return []
  }, [myTeams, allTeams, tab, user, search])

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
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,207,128,0.10),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_18%)]" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold tracking-[0.28em] text-primary uppercase">
              Team Hub
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono-one text-foreground uppercase tracking-tight leading-tight">
              Your <span className="text-primary text-glow">Team</span> Hub.
            </h1>
            <p className="max-w-3xl text-muted-foreground text-base sm:text-lg leading-relaxed">
              A platform that understands the grind. Level up faster, build
              discipline, and conquer challenges together.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/80 bg-card/90 shadow-lg shadow-primary/5 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 h-full flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="h-6 w-6 text-primary" />
                    <Badge className="bg-secondary text-secondary-foreground">
                      Squad
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-mono-one text-primary mb-3 uppercase tracking-tight">
                    Create Your Legion.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Initiate your squad, invite trusted allies, and define your
                    legacy. Your journey to the top starts here.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddTeamForm(true)}
                  className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35"
                >
                  + Create Team
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/90 shadow-lg shadow-rare/5 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 h-full flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Binoculars className="h-6 w-6 text-rare" />
                    <Badge className="bg-secondary text-secondary-foreground">
                      Scout
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-mono-one text-rare mb-3 uppercase tracking-tight">
                    Find Your Allies.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Explore active teams, meet your next squad, and find a group
                    that matches your playstyle and ambition.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-rare/50 text-rare hover:bg-rare hover:text-primary-foreground"
                  onClick={() =>
                    activeTeamsRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }
                >
                  Find Team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/90 shadow-lg shadow-epic/5 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 h-full flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="h-6 w-6 text-epic" />
                    <Badge className="bg-secondary text-secondary-foreground">
                      Ranked
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-mono-one text-epic mb-3 uppercase tracking-tight">
                    Explore Active Legions.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    A quick look at the competition and the teams already
                    pushing forward.
                  </p>

                  <div className="space-y-2">
                    {featuredTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-md border border-border flex items-center justify-center bg-secondary/50 text-muted-foreground">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-sm text-foreground">
                              {team.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {team.users?.length || 0} members
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {team.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {teamMessage && (
          <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground flex items-center justify-between">
            <span>{teamMessage}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearTeamMessage(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

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

        {/* Explore Teams Section */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold tracking-[0.28em] text-primary uppercase">
              Discover
            </p>
            <h2 className="text-3xl sm:text-4xl font-mono-one text-foreground uppercase tracking-tight">
              Explore Teams
            </h2>
            <p className="max-w-3xl text-muted-foreground text-base leading-relaxed">
              Browse active teams, manage your squad, and check your
              invitations.
            </p>
          </div>

          {/* Tabs with Search */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <Tabs
                defaultValue={tab}
                onValueChange={(v) => {
                  setTab(v as any)
                  setSearch('')
                }}
              >
                <TabsList>
                  <TabsTrigger value="allTeams">All Teams</TabsTrigger>
                  <TabsTrigger value="myTeams">My Team</TabsTrigger>
                  <TabsTrigger value="invites">Invites</TabsTrigger>
                </TabsList>
              </Tabs>

              {tab === 'allTeams' && (
                <div className="relative w-full lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-card/80"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Teams Cards */}
        <div ref={activeTeamsRef} className="space-y-4">
          <div
            ref={tab === 'allTeams' ? allTeamsScrollRef : undefined}
            className={
              tab === 'allTeams'
                ? 'flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar'
                : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
            }
          >
            {loading ? (
              <div
                className={
                  tab === 'allTeams'
                    ? 'text-center p-6 rounded-xl border border-border bg-card/60 w-full'
                    : 'col-span-full text-center p-6 rounded-xl border border-border bg-card/60 w-full'
                }
              >
                Loading...
              </div>
            ) : filteredTeams.length === 0 ? (
              <div
                className={
                  tab === 'allTeams'
                    ? 'text-center p-8 text-muted-foreground rounded-xl border border-border bg-card/60 w-full'
                    : 'col-span-full text-center p-8 text-muted-foreground rounded-xl border border-border bg-card/60 w-full'
                }
              >
                {tab === 'allTeams'
                  ? 'No teams available yet'
                  : tab === 'myTeams'
                    ? 'You have no teams yet'
                    : 'You have no invitations yet'}
              </div>
            ) : (
              filteredTeams.map((t) => {
                const leader = t.users?.[0]?.username
                const leaderInitial = leader?.charAt(0)?.toUpperCase() ?? 'T'

                return (
                  <Card
                    key={t.id}
                    className={
                      tab === 'allTeams'
                        ? 'group overflow-hidden border-border/80 bg-card/90 shadow-lg shadow-black/10 transition-all hover:-translate-y-1 hover:shadow-primary/10 cursor-pointer min-w-[320px] sm:min-w-[360px] md:min-w-[400px]'
                        : 'group overflow-hidden border-border/80 bg-card/90 shadow-lg shadow-black/10 transition-all hover:-translate-y-1 hover:shadow-primary/10 cursor-pointer'
                    }
                    onClick={() =>
                      navigate({
                        to: '/teams/$teamId',
                        params: { teamId: String(t.id) },
                      })
                    }
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 flex items-center justify-center rounded-xl border border-border bg-secondary/60 relative shrink-0 overflow-hidden">
                          <Users className="opacity-20 absolute w-full h-full" />
                          <span className="text-xl z-10 font-mono-one">
                            {leaderInitial}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <Badge className="text-[10px] uppercase">
                              {tab === 'invites'
                                ? 'Invite'
                                : tab === 'myTeams'
                                  ? 'My Team'
                                  : 'Public'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase"
                            >
                              {t.status}
                            </Badge>
                          </div>

                          <h3 className="mt-3 text-xl font-bold uppercase tracking-tight truncate">
                            {t.name}
                          </h3>

                          <p className="text-sm text-muted-foreground mt-1">
                            {t.users?.length || 0} Members • Leader: {leader}
                          </p>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex -space-x-2">
                              {t.users?.slice(0, 3).map((m: any) => (
                                <Avatar
                                  key={m.id}
                                  className="border border-background"
                                >
                                  <AvatarFallback>
                                    {m.username?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>

                            {tab === 'invites' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    acceptInvitation(t.id, userId)
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    declineInvitation(t.id, userId)
                                  }}
                                >
                                  Decline
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate({
                                    to: '/teams/$teamId',
                                    params: { teamId: String(t.id) },
                                  })
                                }}
                              >
                                View
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

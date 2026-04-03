import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import {
  Users,
  ChevronLeft,
  MessageCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { useTeamStore } from '@/stores/teamStore'
import { api, useUserStore } from '@/stores/userStore'
import type { Team } from '@/models/team'
import type { User } from '@/models/user'

export const Route = createFileRoute('/teams/$teamId')({
  component: TeamPage,
})

export function TeamPage() {
  const { teamId } = useParams({ from: '/teams/$teamId' })
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.user)

  const fetchTeams = useTeamStore((s) => s.fetchTeams)
  const deleteTeam = useTeamStore((s) => s.deleteTeam)
  const inviteUser = useTeamStore((s) => s.inviteUser)

  const [team, setTeam] = useState<Team | null>(null)
  const [requestedUsers, setRequestedUsers] = useState<User[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)

  // Load team data
  useEffect(() => {
    const loadTeam = async () => {
      try {
        await fetchTeams() // ensure store has latest
        const allTeams = useTeamStore.getState().allTeams

        const t = allTeams.find((t) => String(t.id) === String(teamId)) || null
        if (!t) return
        setTeam(t)

        // Load full users for pending invitations
        if (t.pendingInvitations?.length) {
          // pending invitations either rodha usernames msh id or user w baad lawej f .map (async (u)=> /profile/${u.username})
          const pendingUsers = await Promise.all(
            t.pendingInvitations.map(async (username) => {
              const user = await api.get(`/profile/${username}`)
              return user.data
            }),
          )
          setRequestedUsers(pendingUsers.filter(Boolean) as User[])
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadTeam()
  }, [teamId, fetchTeams])

  // Auto scroll requested users
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
  }, [requestedUsers])

  const handleSendInvitation = async (userId: string) => {
    try {
      if (!team) return
      await inviteUser(team.id, userId)
      setRequestedUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTeam = async (id: number) => {
    try {
      await deleteTeam(id)
      navigate({ to: '/teams' })
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateTeam = (id: number) => {
    console.log('Update team', id)
    // Redirect or open modal for updating team
  }

  if (!team)
    return (
      <div className="p-6 text-center text-muted-foreground">Loading...</div>
    )

  const leader = team.users?.find((u) => String(u.id) === String(team.leaderId))

  return (
    <div className="flex flex-col h-screen bg-background text-muted-foreground mt-16">
      {/* NAVIGATION */}
      <nav className="h-12 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/teams' })}
            className="h-8 w-8 hover:bg-primary-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm tracking-wider uppercase">
              {team.name}
            </span>

            <Badge className="bg-primary/10 text-primary border-primary text-[10px] h-5 uppercase">
              {team.status}
            </Badge>
          </div>
        </div>

        <Button size="sm" variant="outline">
          <MessageCircle className="w-4 h-4 mr-1" /> Chat
        </Button>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-96 border-r border-foreground/5 flex flex-col bg-background overflow-y-auto p-6 space-y-6">
          {/* TEAM INFO */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
              Team Info
            </h3>

            <h1 className="text-3xl text-foreground uppercase tracking-tight">
              {team.name}
            </h1>

            {/* Delete / Update buttons */}
            {String(team.leaderId) === String(currentUser?.id) && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateTeam(team.id)}
                >
                  Update
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteTeam(team.id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Leader */}
          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Leader
              </p>
              <p className="text-lg font-semibold">
                {leader?.username ?? 'N/A'}
              </p>
            </CardContent>
          </Card>

          {/* Creation date */}
          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Created On
              </p>
              <p className="text-lg font-semibold">{team.teamCreationDate}</p>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Members
              </p>
              <div className="flex -space-x-2">
                {(team.users ?? []).map((m) => (
                  <Avatar key={m.id} className="border">
                    <AvatarFallback>{m.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team status */}
          <Card>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">
                  Team Status
                </h4>
              </div>
              <Progress
                value={team.status === 'ACTIVE' ? 100 : 30}
                className="h-1 bg-primary-foreground"
              />
            </CardContent>
          </Card>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* REQUESTED USERS / PENDING INVITATIONS */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Requested Users</h2>

              {requestedUsers.length === 0 ? (
                <p className="text-muted-foreground">No requested users</p>
              ) : (
                <div
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
                >
                  {requestedUsers.map((u) => (
                    <Card
                      key={u.id}
                      className="flex-shrink-0 min-w-[200px] flex flex-col items-center p-4"
                    >
                      <Avatar className="mb-2">
                        <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <p className="font-semibold">{u.username}</p>

                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handleSendInvitation(u.id)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Invite
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Team chat placeholder */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Chat</h2>
              <div className="border border-border/10 rounded-lg p-4 h-64 overflow-y-auto bg-muted/5">
                <p className="text-sm text-muted-foreground">
                  Chat coming soon...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

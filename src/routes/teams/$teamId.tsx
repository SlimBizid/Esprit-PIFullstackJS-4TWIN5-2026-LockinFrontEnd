import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
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
import { useEffect, useState } from 'react'

// Define the route properly for React Router
export const Route = createFileRoute('/teams/$teamId')({
  component: TeamPage,
})

function TeamPage() {
  // Correct usage of useParams
  const { teamId } = useParams({ from: '/teams/$teamId' })

  const navigate = useNavigate()

  const [team, setTeam] = useState<any>(null)
  const [requestedUsers, setRequestedUsers] = useState<any[]>([])

  useEffect(() => {
    // Simulate fetching team data
    const fakeTeam = {
      id: teamId,
      name: `Team ${teamId}`,
      leader: 'Salma Briki',
      creationDate: '2026-03-01',
      status: 'ACTIVE',
      challengesDone: 12,
      members: [
        { id: 'u1', name: 'Salma' },
        { id: 'u2', name: 'Ali' },
        { id: 'u3', name: 'Sara' },
      ],
      pendingRequests: [
        { id: 'u4', name: 'Omar' },
        { id: 'u5', name: 'Lina' },
      ],
    }

    setTeam(fakeTeam)
    setRequestedUsers(fakeTeam.pendingRequests)
  }, [teamId])

  const sendInvitation = (userId: string) => {
    // Remove user from pending requests after invitation
    setRequestedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  if (!team)
    return (
      <div className="p-6 text-center text-muted-foreground">Loading...</div>
    )

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
          <div className="space-y-2">
            <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
              Team Info
            </h3>

            <h1 className="text-3xl text-foreground uppercase tracking-tight">
              {team.name}
            </h1>
          </div>

          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Leader
              </p>
              <p className="text-lg font-semibold">{team.leader}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Created On
              </p>
              <p className="text-lg font-semibold">{team.creationDate}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Challenges Done
              </p>
              <p className="text-lg font-semibold">{team.challengesDone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase">
                Members
              </p>

              <div className="flex -space-x-2">
                {team.members.map((m: any) => (
                  <Avatar key={m.id} className="border">
                    <AvatarFallback>{m.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
          </Card>

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
            {/* PENDING REQUESTS */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Pending Requests</h2>

              {requestedUsers.length === 0 ? (
                <p className="text-muted-foreground">No pending requests</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto hide-scrollbar">
                  {requestedUsers.map((u) => (
                    <Card
                      key={u.id}
                      className="flex-shrink-0 min-w-[200px] flex flex-col items-center p-4"
                    >
                      <Avatar className="mb-2">
                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <p className="font-semibold">{u.name}</p>

                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => sendInvitation(u.id)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Invite
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* TEAM CHAT */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Chat</h2>

              <div className="border border-border/10 rounded-lg p-4 h-64 overflow-y-auto bg-muted/5">
                <p className="text-sm text-muted-foreground">
                  Chat coming soon...
                </p>
              </div>
            </div>

            {/* TEAM CHALLENGES */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Challenges</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: team.challengesDone }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Challenge {i + 1}</span>

                      <Badge className="bg-primary/10 text-primary">
                        Completed
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

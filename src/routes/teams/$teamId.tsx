import {
  createFileRoute,
  useParams,
  useNavigate,
  redirect,
} from '@tanstack/react-router'
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
import { Input } from '@/components/ui/input'
import { TeamChat } from '@/components/TeamChat'

import { useTeamStore } from '@/stores/teamStore'
import { api, useUserStore } from '@/stores/userStore'
import type { Team } from '@/models/team'
import type { User } from '@/models/user'

export const Route = createFileRoute('/teams/$teamId')({
  component: TeamPage,
  loader: async () => {
    const user = useUserStore.getState().user
    if (!user) {
      throw redirect({ to: '/' })
    }
  },
})

export function TeamPage() {
  const { teamId } = useParams({ from: '/teams/$teamId' })
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.user)

  const fetchTeams = useTeamStore((s) => s.fetchTeams)
  const deleteTeam = useTeamStore((s) => s.deleteTeam)
  const inviteUser = useTeamStore((s) => s.inviteUser)
  const removeUserFromTeam = useTeamStore((s) => s.removeUser) // store function
  const updateTeamName = useTeamStore((s) => s.updateTeam) // store function

  const [team, setTeam] = useState<Team | null>(null)
  const [requestedUsers, setRequestedUsers] = useState<User[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updatedTeamName, setUpdatedTeamName] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)

  // Load team data
  // Update your loadTeam function with debugging:
  useEffect(() => {
    const loadTeam = async () => {
      try {
        await fetchTeams()
        const allTeams = useTeamStore.getState().allTeams
        const t = allTeams.find((t) => String(t.id) === String(teamId)) || null
        if (!t) return
        setTeam(t)
        setUpdatedTeamName(t.name)

        // Load full users for pending invitations
        if (t.pendingInvitations?.length) {
          const pendingUsers = await Promise.all(
            t.pendingInvitations.map(async (username) => {
              const user = await api.get(`users/profile/${username}`)
              return user.data
            }),
          )
          setRequestedUsers(pendingUsers.filter(Boolean) as User[])
        }

        // Fetch all users and filter out existing members & pending invitations
        const { data } = await api.get('/users/all-for-invite?role=player');
        const allUsers = sanitizeUserArray(data)

        // DEBUG: Log what we have
        console.log('All users from API:', allUsers)
        console.log('Team members:', t.users)
        console.log('Pending invitations:', t.pendingInvitations)
        console.log('Current user:', currentUser)

        const filteredUsers = allUsers.filter((u: User) => {
          const isTeamMember = t.users.find((member) => member.id === u.id)
          const isPendingInvite = t.pendingInvitations?.includes(u.username)
          const isCurrentUser = u.id === currentUser?.id

          // DEBUG: Log each user's status
          console.log(`User ${u.username}:`, {
            isTeamMember: !!isTeamMember,
            isPendingInvite,
            isCurrentUser,
            keep: !isTeamMember && !isPendingInvite && !isCurrentUser,
          })

          return !isTeamMember && !isPendingInvite && !isCurrentUser
        })

        console.log('Filtered users:', filteredUsers)
        setAvailableUsers(filteredUsers)
      } catch (err) {
        console.error(err)
      }
    }

    loadTeam()
  }, [teamId, fetchTeams, currentUser])

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
  }, [requestedUsers, availableUsers])

 const handleSendInvitation = async (userId: string) => {
  if (!team) return
  const user = availableUsers.find((u) => u.id === userId)
  if (!user) return
  try {
    await inviteUser(team.id, userId) 
    setRequestedUsers((prev) => [...prev, user])
    setAvailableUsers((prev) => prev.filter((u) => u.id !== userId))
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

  const handleRemoveUser = async (userId: string) => {
    if (!team) return
    try {
      await removeUserFromTeam(team.id, userId)
      setTeam({
        ...team,
        users: team.users.filter((u) => u.id !== userId),
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateTeamName = async () => {
    if (!team) return
    try {
      await updateTeamName(team.id, updatedTeamName)
      setTeam({ ...team, name: updatedTeamName })
      setShowUpdateModal(false)
    } catch (err) {
      console.error(err)
    }
  }

  if (!team)
    return (
      <div className="p-6 text-center text-muted-foreground">Loading...</div>
    )

  const leader =
    team.users && team.users.length ? team.users[0].username : 'N/A'

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
          </div>

          {/* Leader */}
          <Card>
            <CardContent className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">
                Leader
              </p>
              <p className="text-lg font-semibold">{leader}</p>
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
                {team.users?.map((m) => (
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

          {/* Delete / Update buttons */}
          {team.users?.[0]?.id === currentUser?.id && (
            <>
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowUpdateModal(true)}
                >
                  Update
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => handleDeleteTeam(team.id)}
                >
                  Delete
                </Button>
              </div>

              {/* Update Modal */}
              {showUpdateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <Card className="p-6 w-96">
                    <h2 className="text-lg font-bold mb-4">Update Team</h2>

                    {/* Team Name */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Team Name
                      </p>
                      <Input
                        value={updatedTeamName}
                        onChange={(e) => setUpdatedTeamName(e.target.value)}
                        placeholder="Enter new team name"
                      />
                    </div>

                    {/* Members List (excluding leader) */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Members
                      </p>
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                        {team.users.slice(1).map((member) => (
                          <div
                            key={member.id}
                            className="flex justify-between items-center border p-2 rounded"
                          >
                            <span>{member.username}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveUser(member.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {team.users.length === 1 && (
                          <p className="text-sm text-muted-foreground">
                            No other members
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleUpdateTeamName}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setShowUpdateModal(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* INVITE USERS */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Invite Users</h2>
              {team.users?.[0]?.id === currentUser?.id ? (
                availableUsers.length === 0 ? (
                  <p className="text-muted-foreground">No users to invite</p>
                ) : (
                  <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
                  >
                    {availableUsers.map((u) => (
                      <Card
                        key={u.id}
                        className="flex-shrink-0 min-w-[200px] flex flex-col items-center p-4"
                      >
                        <Avatar className="mb-2">
                          <AvatarFallback>
                            {u.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <p className="font-semibold">{u.username}</p>

                        <Button
                          size="sm"
                          className="mt-2"
                         onClick={() => {
  if (!u.id) {
    console.error("User ID missing!", u)
    return
  }
  handleSendInvitation(u.id)

}}
                        >
                          <Mail className="w-4 h-4 mr-1" /> Invite
                        </Button>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Only team leader can invite users to the team
                </p>
              )}
            </div>
            {/* Team chat placeholder */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Chat</h2>
              <div className="border border-border/10 rounded-lg p-4 h-64 overflow-y-auto bg-muted/5">
                <div>
                  {team.users.some((u) => u.id === currentUser?.id) ? (
                    <TeamChat
                      teamId={String(team.id)}
                      currentUserId={currentUser?.id || ''}
                      currentUserName={currentUser?.username || 'Unknown'}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">
                      You must be a team member to access this chat.
                    </p>
                  )}
                </div>
              </div>
            </div>
             <div>
              <h2 className="text-2xl font-bold mb-4">challenges</h2>
              <div className="border border-border/10 rounded-lg p-4 h-64 overflow-y-auto bg-muted/5">
                <p className="text-sm text-muted-foreground">
                 //tarak hnee hot eli bech thot
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
function sanitizeUserArray(data: any): User[] {
  if (!Array.isArray(data)) return []
  return data.filter(Boolean) as User[]
}

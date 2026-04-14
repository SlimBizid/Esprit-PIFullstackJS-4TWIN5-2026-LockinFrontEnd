import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Users,
  ChevronLeft,
  MessageCircle,
  Mail,
  ShieldCheck,
  Activity,
  Target,
  Zap,
  Trophy,
  Settings,
  LogOut,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'

import { useTeamStore } from '@/stores/teamStore'
import { api, useUserStore } from '@/stores/userStore'
import type { Team } from '@/models/team'
import type { User } from '@/models/user'

export const Route = createFileRoute('/teams/$teamId')({
  component: TeamPage,
})

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPendingInvitationUsername = (invitation: any): string | undefined => {
  if (typeof invitation === 'string') return invitation
  return invitation?.user?.username
}

const getPendingInvitationUserId = (invitation: any): string | undefined => {
  if (typeof invitation === 'string') return undefined
  return invitation?.userId ?? invitation?.user?.id
}

export function TeamPage() {
  const { teamId } = useParams({ from: '/teams/$teamId' })
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.user)

  const fetchTeams = useTeamStore((s) => s.fetchTeams)
  const deleteTeam = useTeamStore((s) => s.deleteTeam)
  const inviteUser = useTeamStore((s) => s.inviteUser)
  const transferLeadership = useTeamStore((s) => s.transferLeadership)
  const removeUserFromTeam = useTeamStore((s) => s.removeUser)
  const updateTeamName = useTeamStore((s) => s.updateTeam)
  const teamMessage = useTeamStore((s) => s.message)
  const setTeamMessage = useTeamStore((s) => s.setMessage)

  const [team, setTeam] = useState<Team | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [updatedTeamName, setUpdatedTeamName] = useState('')
  const [newLeaderIdForQuit, setNewLeaderIdForQuit] = useState('')

  // Load team data
  useEffect(() => {
    const loadTeam = async () => {
      try {
        await fetchTeams()
        const allTeams = useTeamStore.getState().allTeams
        const t = allTeams.find((t) => String(t.id) === String(teamId)) || null
        if (!t) return
        setTeam(t)
        setUpdatedTeamName(t.name)

        // Fetch all users for potential invitations
        const { data } = await api.get('/users/all-for-invite?role=player')
        const allUsers = sanitizeUserArray(data)

        const filteredUsers = allUsers.filter((u: User) => {
          const isTeamMember = t.users.find((member) => member.id === u.id)
          const isPendingInvite = (t.pendingInvitations ?? []).some(
            (invitation) =>
              getPendingInvitationUserId(invitation) === u.id ||
              getPendingInvitationUsername(invitation) === u.username,
          )
          const isCurrentUser = u.id === currentUser?.id

          return !isTeamMember && !isPendingInvite && !isCurrentUser
        })

        setAvailableUsers(filteredUsers)
      } catch (err) {
        console.error(err)
      }
    }

    loadTeam()
  }, [teamId, fetchTeams, currentUser])

  const handleSendInvitation = async (userId: string) => {
    if (!team) return
    try {
      await inviteUser(team.id, userId)
      setTeamMessage('Invitation sent successfully!')
      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err) {
      console.error(err)
      setTeamMessage('Failed to send invitation.')
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

  const handleQuitTeam = async () => {
    if (!team || !currentUser) return
    try {
      if (isLeader) {
        if (!newLeaderIdForQuit) {
          setTeamMessage('Please choose a new leader before quitting the team.')
          return
        }

        await transferLeadership(team.id, newLeaderIdForQuit)
      }

      await removeUserFromTeam(team.id, currentUser.id)
      setTeamMessage('Oh no, a member has quit the team.')
      navigate({ to: '/teams' })
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

  const leaderIdValue =
    typeof team.leaderId === 'string'
      ? team.leaderId
      : (team.leaderId?.id ?? team.users?.[0]?.id)

  const leader =
    (typeof team.leaderId === 'object' ? team.leaderId?.username : undefined) ??
    team.users?.find((u) => String(u.id) === String(leaderIdValue))?.username ??
    team.users?.[0]?.username ??
    'N/A'

  const isLeader = String(currentUser?.id) === String(leaderIdValue)

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,207,128,0.10),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_18%)]" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/teams' })}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Teams
        </Button>

        {/* Header */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg border border-border bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-mono-one uppercase tracking-tight text-foreground">
                    {team.name}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Leader: {leader}
                  </p>
                </div>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary uppercase">
              {team.status}
            </Badge>
          </div>
        </div>

        {/* Message */}
        {teamMessage && (
          <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground flex items-center justify-between">
            <span>{teamMessage}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTeamMessage(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Team Info & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Info & Members */}
            <Card className="border-border/80 bg-card/90 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  Team Info & Members
                </h2>
                <p className="text-sm text-muted-foreground">
                  Created On: {formatDateTime(team.teamCreationDate)}
                </p>

                {/* Members Grid */}
                <div className="grid grid-cols-5 gap-3">
                  {team.users?.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 bg-secondary/20 group cursor-pointer hover:bg-secondary/40 transition-colors"
                    >
                      <Avatar className="border-2 border-border">
                        <AvatarFallback className="text-lg font-bold">
                          {m.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-semibold text-center truncate">
                        {m.username}
                      </p>
                      {String(m.id) === String(leaderIdValue) && (
                        <div className="text-xs text-primary font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Leader
                        </div>
                      )}
                      {isLeader && String(m.id) !== String(leaderIdValue) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveUser(m.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Team Status */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-widest">
                      Team Status
                    </h4>
                  </div>
                  <Progress
                    value={team.status === 'ACTIVE' ? 100 : 30}
                    className="h-2 bg-primary-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/80 bg-card/90 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Placeholder Activities */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-secondary/10 transition-colors">
                    <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-foreground font-semibold">
                        {leader} solved challenge
                      </p>
                      <p className="text-xs text-muted-foreground">Web 101</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-secondary/10 transition-colors">
                    <div className="w-8 h-8 rounded-md bg-rare/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-rare" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-foreground font-semibold">
                        {team.name} team score increased
                      </p>
                      <p className="text-xs text-muted-foreground">+50 pts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-secondary/10 transition-colors">
                    <div className="w-8 h-8 rounded-md bg-epic/20 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-epic" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-foreground font-semibold">
                        {team.name} ranked #8 in Leaderboard
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Global Rank
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Performance & Actions */}
          <div className="space-y-6">
            {/* Performance Dashboard */}
            <Card className="border-border/80 bg-card/90 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  Performance
                </h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Team Score
                    </p>
                    <p className="text-3xl font-mono-one text-primary">1,250</p>
                    <p className="text-xs text-muted-foreground mt-1">pts</p>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-rare/50 bg-rare/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Global Rank
                    </p>
                    <p className="text-3xl font-mono-one text-rare">#8</p>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-epic/50 bg-epic/5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Challenges
                    </p>
                    <p className="text-3xl font-mono-one text-epic">12 / 20</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/80 bg-card/90 shadow-lg">
              <CardContent className="p-6 space-y-3">
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  Quick Actions
                </h2>

                {isLeader ? (
                  <Button
                    className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Invite Member
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Only team leader can invite users
                  </p>
                )}

                {isLeader && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowUpdateModal(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" /> Manage Team
                  </Button>
                )}

                {team.users?.some((u) => u.id === currentUser?.id) && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleQuitTeam}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Quit Team
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Team Chat */}
            <Card className="border-border/80 bg-card/90 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Team Chat
                </h2>
                <div className="h-48 rounded-lg border border-border/50 bg-secondary/5 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Chat coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Update Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="p-6 w-96">
              <h2 className="text-lg font-bold mb-4">Update Team</h2>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Team Name</p>
                <Input
                  value={updatedTeamName}
                  onChange={(e) => setUpdatedTeamName(e.target.value)}
                  placeholder="Enter new team name"
                />
              </div>

              {isLeader && team.users.length > 1 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Members</p>
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
                  </div>
                </div>
              )}

              {isLeader && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Transfer Leadership
                  </p>
                  <select className="w-full border rounded px-2 py-1 text-sm">
                    <option value="">Select new leader</option>
                    {team.users
                      .filter((u) => u.id !== leaderIdValue)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username}
                        </option>
                      ))}
                  </select>
                </div>
              )}

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

              {isLeader && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    Delete Team
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Leader Transfer Before Quit */}
        {isLeader && team.users?.some((u) => u.id === currentUser?.id) && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
            <p className="text-sm font-semibold">
              Before quitting, please choose a new leader:
            </p>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={newLeaderIdForQuit}
              onChange={(e) => setNewLeaderIdForQuit(e.target.value)}
            >
              <option value="">Select a new leader</option>
              {team.users
                .filter((u) => u.id !== currentUser?.id)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Invite Users Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">
                Invite Members
              </h2>

              {availableUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No users available to invite.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    >
                      <Avatar>
                        <AvatarFallback className="text-lg font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-semibold text-center truncate">
                        {user.username}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handleSendInvitation(user.id)}
                      >
                        <Mail className="w-3 h-3 mr-1" /> Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowInviteModal(false)}
              >
                Close
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
function sanitizeUserArray(data: any): User[] {
  if (!Array.isArray(data)) return []
  return data.filter(Boolean) as User[]
}

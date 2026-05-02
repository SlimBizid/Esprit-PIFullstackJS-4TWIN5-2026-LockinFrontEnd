import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/stores/userStore'
import { useTeamStore } from '@/stores/teamStore'
import type { Team } from '@/models/team'
import { UserType, type User } from '@/models/user'

const user: User = {
  id: 'user-1',
  username: 'ram',
  githubHandle: 'ramdev',
  email: 'ram@example.com',
  type: UserType.PLAYER,
  coins: 10,
  xp: 50,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const team = (overrides: Partial<Team> = {}): Team => ({
  pendingRequests: [],
  id: 1,
  name: 'Byte Raiders',
  teamCreationDate: '2026-01-01',
  teamDeletionDate: null,
  users: [user],
  leaderId: user.id,
  pendingInvitations: [],
  status: 'ACTIVE',
  ...overrides,
})

function resetTeamStore() {
  useTeamStore.setState({
    allTeams: [],
    myTeams: [],
    isLoading: false,
    error: null,
    message: null,
  })
}

describe('useTeamStore', () => {
  beforeEach(() => {
    resetTeamStore()
  })

  it('fetches all teams and accepts a single-team response shape', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: team() } as never)

    await useTeamStore.getState().fetchTeams()

    expect(useTeamStore.getState().allTeams).toEqual([team()])
    expect(useTeamStore.getState().isLoading).toBe(false)
  })

  it('stores fetchTeams backend errors', async () => {
    const error = new AxiosError('failed')
    error.response = {
      data: { message: 'Failed to fetch teams' },
    } as never
    vi.spyOn(api, 'get').mockRejectedValueOnce(error)

    await useTeamStore.getState().fetchTeams()

    expect(useTeamStore.getState().error).toBe('Failed to fetch teams')
  })

  it('prevents creating a second team when the user already belongs to one', async () => {
    useTeamStore.setState({ myTeams: [team()] })

    await useTeamStore.getState().createTeam('Another Team', user.id)

    expect(useTeamStore.getState().message).toBe(
      'You need to quit your current team to enter another team or create a new one.',
    )
  })

  it('creates a team and appends it to both collections', async () => {
    const createdTeam = team({ id: 2, name: 'New Team' })
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: createdTeam } as never)

    await useTeamStore.getState().createTeam('New Team', user.id)

    expect(api.post).toHaveBeenCalledWith('/teams', {
      name: 'New Team',
      leaderId: user.id,
    })
    expect(useTeamStore.getState().allTeams).toEqual([createdTeam])
    expect(useTeamStore.getState().myTeams).toEqual([createdTeam])
    expect(useTeamStore.getState().message).toBe(
      'Yeyy! You created your own team.',
    )
  })

  it('updates a team in both arrays', async () => {
    const original = team()
    const updated = team({ name: 'Renamed Team' })
    useTeamStore.setState({ allTeams: [original], myTeams: [original] })
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: updated } as never)

    await useTeamStore.getState().updateTeam(original.id, updated.name)

    expect(useTeamStore.getState().allTeams[0].name).toBe('Renamed Team')
    expect(useTeamStore.getState().myTeams[0].name).toBe('Renamed Team')
  })

  it('deletes a team from both arrays', async () => {
    const existing = team()
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'delete').mockResolvedValueOnce({} as never)

    await useTeamStore.getState().deleteTeam(existing.id)

    expect(useTeamStore.getState().allTeams).toEqual([])
    expect(useTeamStore.getState().myTeams).toEqual([])
  })

  it('accepts an invitation, removes the pending entry, and adds the team', async () => {
    const invitedTeam = team({
      pendingInvitations: [{ userId: user.id }, 'other-user'],
      status: 'PENDING',
    })
    const acceptedTeam = team({
      pendingInvitations: ['other-user'],
      users: [user],
      status: 'ACTIVE',
    })
    useTeamStore.setState({ allTeams: [invitedTeam], myTeams: [] })

    const postSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce({ data: acceptedTeam } as never)
    const fetchMyTeamsSpy = vi
      .spyOn(useTeamStore.getState(), 'fetchMyTeams')
      .mockResolvedValueOnce()

    await useTeamStore.getState().acceptInvitation(invitedTeam.id, user.id)

    expect(postSpy).toHaveBeenCalledWith(`/teams/${invitedTeam.id}/accept`, {
      userId: user.id,
    })
    expect(useTeamStore.getState().allTeams[0].pendingInvitations).toEqual([
      'other-user',
    ])
    expect(useTeamStore.getState().myTeams).toEqual([acceptedTeam])
    expect(useTeamStore.getState().message).toBe(
      'Yeyy! You have been added to this team.',
    )
    expect(fetchMyTeamsSpy).toHaveBeenCalledTimes(1)
  })

  it('reverts optimistic invitation removal when accept fails', async () => {
    const invitedTeam = team({
      pendingInvitations: [{ user: { id: user.id } }, 'other-user'],
      status: 'PENDING',
    })
    const previousAllTeams = [invitedTeam]
    useTeamStore.setState({ allTeams: previousAllTeams, myTeams: [] })

    const error = new AxiosError('failed')
    error.response = {
      data: { message: 'Failed to accept invitation' },
    } as never
    vi.spyOn(api, 'post').mockRejectedValueOnce(error)

    await expect(
      useTeamStore.getState().acceptInvitation(invitedTeam.id, user.id),
    ).rejects.toBe(error)

    expect(useTeamStore.getState().allTeams).toEqual(previousAllTeams)
    expect(useTeamStore.getState().error).toBe('Failed to accept invitation')
  })

  it('declines an invitation and keeps the updated team in place', async () => {
    const invitedTeam = team({
      pendingInvitations: [user.id, 'other-user'],
      status: 'PENDING',
    })
    const declinedTeam = team({
      pendingInvitations: ['other-user'],
      status: 'PENDING',
    })
    useTeamStore.setState({ allTeams: [invitedTeam], myTeams: [invitedTeam] })
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: declinedTeam } as never)

    await useTeamStore.getState().declineInvitation(invitedTeam.id, user.id)

    expect(useTeamStore.getState().allTeams[0].pendingInvitations).toEqual([
      'other-user',
    ])
    expect(useTeamStore.getState().message).toBe('Invitation declined.')
  })
})

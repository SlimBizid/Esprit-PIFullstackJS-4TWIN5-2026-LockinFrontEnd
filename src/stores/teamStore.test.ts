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

  it('sets the message synchronously', () => {
    useTeamStore.getState().setMessage('Heads up')
    expect(useTeamStore.getState().message).toBe('Heads up')
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

  it('falls back to unknown fetchTeams errors for non-axios failures', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('boom'))

    await useTeamStore.getState().fetchTeams()

    expect(useTeamStore.getState().error).toBe('Unknown error')
  })

  it('fetches my teams and stores message-based failures', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: [team({ id: 4 })] } as never)

    await useTeamStore.getState().fetchMyTeams()

    expect(useTeamStore.getState().myTeams).toEqual([team({ id: 4 })])

    vi.spyOn(api, 'get').mockRejectedValueOnce({ message: 'No team data' } as never)
    await useTeamStore.getState().fetchMyTeams()
    expect(useTeamStore.getState().error).toBe('No team data')
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

  it('stores an invalid team error when createTeam returns the wrong shape', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { ok: true } } as never)

    await useTeamStore.getState().createTeam('Broken Team', user.id)

    expect(useTeamStore.getState().error).toBe('Invalid team data')
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

  it('stores an invalid team error when updateTeam returns the wrong shape', async () => {
    const original = team()
    useTeamStore.setState({ allTeams: [original], myTeams: [original] })
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: { ok: true } } as never)

    await useTeamStore.getState().updateTeam(original.id, 'Broken')

    expect(useTeamStore.getState().error).toBe('Invalid team data')
  })

  it('deletes a team from both arrays', async () => {
    const existing = team()
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'delete').mockResolvedValueOnce({} as never)

    await useTeamStore.getState().deleteTeam(existing.id)

    expect(useTeamStore.getState().allTeams).toEqual([])
    expect(useTeamStore.getState().myTeams).toEqual([])
  })

  it('stores a deleteTeam error message from the backend', async () => {
    const existing = team()
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    const error = new AxiosError('failed')
    error.response = {
      data: { message: 'Failed to delete team' },
    } as never
    vi.spyOn(api, 'delete').mockRejectedValueOnce(error)

    await expect(useTeamStore.getState().deleteTeam(existing.id)).rejects.toBe(error)

    expect(useTeamStore.getState().error).toBe('Failed to delete team')
  })

  it('invites a user and updates team state', async () => {
    const existing = team()
    const updated = team({ pendingInvitations: ['new-user'] })
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: updated } as never)

    await useTeamStore.getState().inviteUser(existing.id, 'new-user')

    expect(useTeamStore.getState().allTeams[0].pendingInvitations).toEqual([
      'new-user',
    ])
    expect(useTeamStore.getState().message).toBe('Invitation sent.')
  })

  it('stores an invalid team error when inviteUser returns the wrong shape', async () => {
    const existing = team()
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { ok: true } } as never)

    await useTeamStore.getState().inviteUser(existing.id, 'new-user')

    expect(useTeamStore.getState().error).toBe('Invalid team data')
  })

  it('transfers leadership and updates both collections', async () => {
    const existing = team()
    const updated = team({ leaderId: 'user-2' })
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: updated } as never)

    await useTeamStore.getState().transferLeadership(existing.id, 'user-2')

    expect(useTeamStore.getState().allTeams[0].leaderId).toBe('user-2')
    expect(useTeamStore.getState().message).toBe(
      'Leadership transferred successfully.',
    )
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

  it('prevents accepting an invitation when the user already has a team', async () => {
    useTeamStore.setState({ myTeams: [team()] })

    await useTeamStore.getState().acceptInvitation(1, user.id)

    expect(useTeamStore.getState().message).toBe(
      'You need to quit your current team to enter another team or create a new one.',
    )
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

  it('restores prior state when declining an invitation fails', async () => {
    const invitedTeam = team({
      pendingInvitations: [user.id, 'other-user'],
      status: 'PENDING',
    })
    useTeamStore.setState({ allTeams: [invitedTeam], myTeams: [] })
    const error = new AxiosError('failed')
    error.response = {
      data: { message: 'Failed to decline invitation' },
    } as never
    vi.spyOn(api, 'post').mockRejectedValueOnce(error)

    await expect(
      useTeamStore.getState().declineInvitation(invitedTeam.id, user.id),
    ).rejects.toBe(error)

    expect(useTeamStore.getState().allTeams).toEqual([invitedTeam])
    expect(useTeamStore.getState().error).toBe('Failed to decline invitation')
  })

  it('removes a user and refreshes my teams', async () => {
    const existing = team()
    const updated = team({ users: [] })
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'delete').mockResolvedValueOnce({ data: updated } as never)
    const fetchMyTeamsSpy = vi
      .spyOn(useTeamStore.getState(), 'fetchMyTeams')
      .mockResolvedValueOnce()

    await useTeamStore.getState().removeUser(existing.id, user.id)

    expect(useTeamStore.getState().allTeams[0].users).toEqual([])
    expect(useTeamStore.getState().message).toBe(
      'Oh no, a member has quit the team.',
    )
    expect(fetchMyTeamsSpy).toHaveBeenCalledTimes(1)
  })

  it('stores an invalid team error when removeUser returns the wrong shape', async () => {
    const existing = team()
    useTeamStore.setState({ allTeams: [existing], myTeams: [existing] })
    vi.spyOn(api, 'delete').mockResolvedValueOnce({ data: { ok: true } } as never)

    await useTeamStore.getState().removeUser(existing.id, user.id)

    expect(useTeamStore.getState().error).toBe('Invalid team data')
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

describe('ui primitives', () => {
  it('renders button variants and supports asChild', () => {
    const { rerender } = render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button.getAttribute('data-variant')).toBe('destructive')
    expect(button.getAttribute('data-size')).toBe('sm')
    expect(button.className).toContain('cursor-pointer')

    rerender(
      <Button asChild variant="link">
        <a href="/profile">Profile</a>
      </Button>,
    )

    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('href')).toBe(
      '/profile',
    )
  })

  it('renders alert primitives with slots and destructive styling', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Danger zone</AlertTitle>
        <AlertDescription>
          <p>Changes here cannot be undone.</p>
        </AlertDescription>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert.getAttribute('data-slot')).toBe('alert')
    expect(alert.className).toContain('text-destructive')
    expect(screen.getByText('Danger zone').getAttribute('data-slot')).toBe(
      'alert-title',
    )
    expect(
      screen.getByText('Changes here cannot be undone.').parentElement?.getAttribute(
        'data-slot',
      ),
    ).toBe('alert-description')
  })

  it('renders badge and input with merged attributes', () => {
    render(
      <>
        <Badge variant="secondary">Rare</Badge>
        <Input type="email" placeholder="Email" />
      </>,
    )

    expect(screen.getByText('Rare').getAttribute('data-slot')).toBe('badge')
    expect(screen.getByText('Rare').getAttribute('data-variant')).toBe(
      'secondary',
    )
    expect(screen.getByPlaceholderText('Email').getAttribute('data-slot')).toBe(
      'input',
    )
    expect(screen.getByPlaceholderText('Email').getAttribute('type')).toBe(
      'email',
    )
  })

  it('renders card primitives with their slot markers', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Team summary</CardTitle>
          <CardDescription>Latest stats</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )

    expect(screen.getByText('Team summary').getAttribute('data-slot')).toBe(
      'card-title',
    )
    expect(screen.getByText('Latest stats').getAttribute('data-slot')).toBe(
      'card-description',
    )
    expect(screen.getByText('Action').getAttribute('data-slot')).toBe(
      'card-action',
    )
    expect(screen.getByText('Body').getAttribute('data-slot')).toBe('card-content')
    expect(screen.getByText('Footer').getAttribute('data-slot')).toBe(
      'card-footer',
    )
  })

  it('renders table primitives with semantic sections', () => {
    render(
      <Table>
        <TableCaption>Leaderboard</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ram</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )

    expect(screen.getByText('Leaderboard').tagName).toBe('CAPTION')
    expect(screen.getByText('Name').getAttribute('data-slot')).toBe('table-head')
    expect(screen.getByText('Ram').getAttribute('data-slot')).toBe('table-cell')
    expect(screen.getByText('Total').closest('tfoot')?.getAttribute('data-slot')).toBe(
      'table-footer',
    )
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

describe('navigation family primitives', () => {
  it('renders pagination pieces with expected metadata', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#prev" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#1" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    expect(document.querySelector('[data-slot="pagination"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="pagination-content"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="pagination-item"]')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go to previous page' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go to next page' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '1' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(document.querySelector('[data-slot="pagination-ellipsis"]')).toBeTruthy()
  })

  it('renders tabs and switches visible content', () => {
    render(
      <Tabs defaultValue="tab1" orientation="vertical">
        <TabsList variant="line">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">First panel</TabsContent>
        <TabsContent value="tab2">Second panel</TabsContent>
      </Tabs>,
    )

    expect(document.querySelector('[data-slot="tabs"]')?.getAttribute('data-orientation')).toBe(
      'vertical',
    )
    expect(document.querySelector('[data-slot="tabs-list"]')?.getAttribute('data-variant')).toBe(
      'line',
    )
    expect(screen.getByText('First panel')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
    const tabPanels = document.querySelectorAll('[data-slot="tabs-content"]')
    expect(tabPanels.length).toBe(2)
    expect(tabPanels[1]?.getAttribute('data-state')).toBe('inactive')
  })

  it('renders sheet content and supports directional classes', () => {
    render(
      <Sheet open>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Links and actions</SheetDescription>
          </SheetHeader>
          <SheetFooter>Footer</SheetFooter>
        </SheetContent>
      </Sheet>,
    )

    const content = document.querySelector('[data-slot="sheet-content"]')
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toBeTruthy()
    expect(content?.className).toContain('border-r')
    expect(screen.getByText('Menu').getAttribute('data-slot')).toBe('sheet-title')
    expect(screen.getByText('Links and actions').getAttribute('data-slot')).toBe(
      'sheet-description',
    )
    expect(screen.getByText('Footer').getAttribute('data-slot')).toBe('sheet-footer')
  })

  it('renders navigation menu structure with optional viewport', () => {
    render(
      <NavigationMenu viewport={true}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/docs">Overview</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator />
      </NavigationMenu>,
    )

    expect(document.querySelector('[data-slot="navigation-menu"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="navigation-menu-list"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="navigation-menu-item"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Docs/i })).toBeTruthy()
    expect(navigationMenuTriggerStyle()).toContain('inline-flex')
  })
})

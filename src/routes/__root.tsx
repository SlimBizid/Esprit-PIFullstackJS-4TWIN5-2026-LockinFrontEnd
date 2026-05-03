import { lazy, Suspense } from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { initializeAuth } from '@/stores/userStore'

import type { QueryClient } from '@tanstack/react-query'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from 'next-themes'

const Footer = lazy(() => import('@/components/Footer'))

interface MyRouterContext {
  queryClient: QueryClient
}

initializeAuth()
export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex flex-col justify-between">
          <a
            href="#main-content"
            className="
          sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100
          focus:rounded-md focus:bg-primary focus:px-4 focus:py-2
          focus:text-primary-foreground focus:font-semibold focus:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        "
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
      </ThemeProvider>
    </>
  ),
})

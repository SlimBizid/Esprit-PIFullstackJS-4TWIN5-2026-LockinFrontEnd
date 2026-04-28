import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { initializeAuth } from '@/stores/userStore'
// import Header from '../components/Header'

import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from 'next-themes'
import Footer from '@/components/Footer'

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
          <Footer />
        </div>
      </ThemeProvider>

      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),
})

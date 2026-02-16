import { createFileRoute } from '@tanstack/react-router'
import { ThemeProvider } from '@/components/ThemeProvider'
import Navbar from '@/components/Navbar';

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Navbar/>
    </ThemeProvider>
  )
}

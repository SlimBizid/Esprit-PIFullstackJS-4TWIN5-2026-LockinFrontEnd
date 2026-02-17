import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/challenges')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/challenges"!</div>
}

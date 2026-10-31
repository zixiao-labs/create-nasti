import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/about')({
  component: () => <h1>About</h1>,
})

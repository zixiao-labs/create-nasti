import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const getMessage = createServerFn({ method: 'GET' }).handler(() => 'Hello from the server!')

export const Route = createFileRoute('/')({
  loader: () => getMessage(),
  component: Home,
})

function Home() {
  const [count, setCount] = useState(0)
  const message = Route.useLoaderData()

  return (
    <main>
      <h1>Nasti + React Start</h1>
      <p>{message}</p>
      <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
    </main>
  )
}

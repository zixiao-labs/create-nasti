import { createSignal } from 'solid-js'
import { createFileRoute } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'

const getMessage = createServerFn({ method: 'GET' }).handler(() => 'Hello from the server!')

export const Route = createFileRoute('/')({
  loader: () => getMessage(),
  component: Home,
})

function Home() {
  const [count, setCount] = createSignal(0)
  const message = Route.useLoaderData()

  return (
    <main>
      <h1>Nasti + Solid Start</h1>
      <p>{message()}</p>
      <button onClick={() => setCount((c) => c + 1)}>count is {count()}</button>
    </main>
  )
}

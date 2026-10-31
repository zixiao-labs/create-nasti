import { createSignal } from 'solid-js'

export function App() {
  const [count, setCount] = createSignal(0)

  return (
    <main>
      <h1>Nasti + Solid</h1>
      <button onClick={() => setCount((c) => c + 1)}>count is {count()}</button>
      <p>Edit <code>src/App.tsx</code> and save to test Solid Refresh.</p>
    </main>
  )
}

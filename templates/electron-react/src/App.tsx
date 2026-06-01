import { useState } from 'react'

export function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>Nasti + Electron + React</h1>
      <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
      <p>
        Edit <code>src/App.tsx</code> for the renderer, or{' '}
        <code>src/electron/main.ts</code> for the main process.
      </p>
    </main>
  )
}

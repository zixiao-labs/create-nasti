import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/solid-router'
import { HydrationScript } from 'solid-js/web'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Nasti + Solid Start' },
    ],
  }),
  component: () => (
    <html lang="en">
      <head><HydrationScript /><HeadContent /></head>
      <body>
        <nav><Link to="/">Home</Link> <Link to="/about">About</Link></nav>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
})

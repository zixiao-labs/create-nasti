import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Nasti + React Start' },
    ],
  }),
  component: () => (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <nav><Link to="/">Home</Link> <Link to="/about">About</Link></nav>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
})

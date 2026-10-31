# Nasti + Solid Start

Requires Node.js >=22.12.0.

```sh
npm install
npm run dev
npm run build
npm run preview
```

Nasti provides native Solid DOM/SSR compilation, client/SSR pipelines and
default entries from `src/router.tsx` and `src/routes/`. The document shell
includes Solid's `HydrationScript`. No `index.html` or Vite plugin is needed.
The home route demonstrates a server-function loader and a signal counter.

Development changes trigger a whole-application rebuild and full-page refresh,
not state-preserving Start HMR. RSC, automatic route splitting, prerender/SPA
mode and third-party deployment plugins are not supported by this adapter.
Redact is React-only and must not be added to this Solid app.

Keep the pinned TanStack runtime/compiler versions together. In particular,
`@tanstack/start-plugin-core@1.171.55` is a private compiler contract checked
by Nasti; do not upgrade it independently or add a second `tanstackRouter()`.
Solid's Babel compiler and Refresh dependencies must stay in this application.

Build output is `dist/client/` and `dist/server/server.mjs`, which exports
`{ fetch(request) }`. `npm run preview` serves SSR locally. For deployment,
adapt the server fetch handler to your platform and serve **only `dist/client/`**
as public assets; never expose the entire `dist/` directory.

See the [Nasti native integration guide](https://github.com/zixiao-labs/Nasti/blob/v2.8.0/playground/tanstack-react/README.md)
for adapter limits.

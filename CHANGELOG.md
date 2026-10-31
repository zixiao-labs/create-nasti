# Changelog

## Unreleased

- Upgrade all seven templates to Nasti `^2.9.0`, retaining the native Router /
  Start integrations, pinned framework compilers and Start's Node >=22.12 gate.
- Update Start guides for state-preserving React/Solid Refresh, loader-data
  refresh on server edits and the remaining full-reload / SSR compilation limits.
- Verify Start's compiled client modules and scripts in development while keeping
  raw source, server-function provider queries and generated server entries private.

## 3.1.0

- Upgrade all generated applications to Nasti `^2.8.1`, including the 2.8 native
  integrations and the npm optional-peer resolution fix. Keep peer validation
  enabled without `legacy-peer-deps` workarounds.
- Add `solid`, `react-start` and `solid-start` templates with application-local
  compiler dependencies and the upstream-tested TanStack/Solid versions.
- Use Nasti's native `tanstackRouter()` in `react-tanstack`, replacing the
  standalone plugin. Explicit `.lazy.tsx` routes preserve route code splitting;
  the native adapter does not automatically extract components.
- Require Node >=22.12 only for Start templates, with an early CLI error on
  unsupported versions. Ordinary templates retain the existing Node engines.
- Document Start's SSR output, preview, deployment boundaries and full-page
  development refresh, plus optional React-only Redact integration.
- Extend offline CLI regression tests and real-template smoke tests to all seven
  templates, including Start SSR, routes, client assets and source isolation.
- Gate tag-triggered npm publication on version matching, typecheck, CLI tests
  and real-template smoke tests; retain OIDC provenance publishing.

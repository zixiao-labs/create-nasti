import { defineConfig, tanstackRouter } from '@nasti-toolchain/nasti'

export default defineConfig({
  framework: 'react',
  // Use .lazy.tsx route files for native code splitting.
  plugins: [tanstackRouter()],
})

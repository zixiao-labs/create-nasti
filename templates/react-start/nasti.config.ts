import { defineConfig, tanstackStart } from '@nasti-toolchain/nasti'

export default defineConfig({
  framework: 'react',
  plugins: [tanstackStart()],
})

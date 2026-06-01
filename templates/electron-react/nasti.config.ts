import { defineConfig } from '@nasti-toolchain/nasti'

export default defineConfig({
  framework: 'react',
  target: 'electron',
  electron: {
    main: 'src/electron/main.ts',
    preload: 'src/electron/preload.ts',
    mainFormat: 'cjs',
    preloadFormat: 'cjs',
    // Electron 41 捆绑 Node 22 / Chromium 138
    nodeTarget: 'node22',
    minVersion: 41,
  },
})

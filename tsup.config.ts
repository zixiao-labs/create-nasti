import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  dts: false,
  // CLI 由 Node 直接执行，需要 shebang
  banner: { js: '#!/usr/bin/env node' },
  // 把交互依赖内联进单文件，避免 `npm create` 临时安装期的依赖解析抖动
  noExternal: ['@clack/prompts', 'picocolors', 'mri'],
})

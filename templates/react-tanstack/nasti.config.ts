import { defineConfig } from '@nasti-toolchain/nasti'
import { tanstackRouter } from '@nasti-toolchain/plugin-tanstack'

export default defineConfig({
  framework: 'react',
  plugins: [
    tanstackRouter({
      // 构建期把每个路由组件切成独立 chunk（dev 下内联，行为正确）
      autoCodeSplitting: true,
    }),
  ],
})

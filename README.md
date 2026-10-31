<div align="center">

# create-nasti

**一行命令创建 [Nasti](https://github.com/zixiao-labs/Nasti) 项目**

*React / Vue / Solid / TanStack Router & Start / Electron 开箱即用*

[![npm](https://img.shields.io/npm/v/create-nasti)](https://www.npmjs.com/package/create-nasti)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

---

## 用法

```bash
# npm
npm create nasti@latest

# pnpm
pnpm create nasti

# yarn
yarn create nasti

# bun
bun create nasti
```

按提示选择项目目录与模板即可。也可以在命令行直接指定：

```bash
# pnpm / yarn / bun 可直接传参
pnpm create nasti my-app --template react-tanstack

# npm 传参需要加 `--` 分隔
npm create nasti@latest my-app -- --template react-tanstack
```

## 模板

| 模板 | 说明 |
| --- | --- |
| `react-tanstack` | React + [TanStack Router](https://tanstack.com/router) 原生文件式路由，`.lazy.tsx` 手工路由分包（**头牌**） |
| `react` | 最小 React 单页应用 |
| `vue` | Vue 3 单文件组件（SFC） |
| `solid` | Solid 单页应用，原生 JSX 编译与 Solid Refresh |
| `react-start` | React + TanStack Start，原生 SSR 与 server functions（Node ≥22.12） |
| `solid-start` | Solid + TanStack Start，原生 SSR 与 server functions（Node ≥22.12） |
| `electron-react` | Electron 41+ 主进程 / Preload + React 渲染层，`dev` 直接启动桌面窗口 |

创建完成后：

```bash
cd my-app
npm install        # 若创建时未自动安装
npm run dev
```

Electron 模板中，`npm run dev` 启动桌面开发环境，`npm run build` 同时构建主进程、Preload 和渲染层。只调试渲染层时可运行 `npm run dev:renderer`；原有 `electron` / `electron:build` 脚本仍可使用。`preview` 仅预览 Web 渲染层，不会启动桌面窗口。

## Nasti 2.9 模板基线

脚手架生成的项目默认基于 **[Nasti](https://github.com/zixiao-labs/Nasti/releases/tag/v2.9.0) ^2.9.0**（Rolldown / Oxc 驱动），会接收后续兼容的 2.x 更新。2.9.0 保留 2.8 的原生框架集成与 2.8.1 的 npm 可选 peer 解析修复，并改进 Start 状态保留与开发日志，无需 `legacy-peer-deps` 或关闭 peer 校验。React 使用 ^19.2.8，Vue 与 `@vue/compiler-sfc` 使用匹配的 ^3.5.42 稳定版本，Solid 使用上游验证的 1.9.17。

`react-tanstack` 使用 Nasti 主包内置的 `tanstackRouter()`，不再安装独立的 `@nasti-toolchain/plugin-tanstack`。内置适配不支持自动提取路由组件；模板以 `index.lazy.tsx` / `about.lazy.tsx` 显式保留路由分包。文件路由生成器固定为 `@tanstack/router-generator@1.167.46`，React Router 固定为 1.170.46。

模板保持最小配置，直接使用新版默认的 JSX / Fast Refresh、Vue SFC 与构建管线；React Compiler、RSC 和 Vue 3.6 Vapor Mode 属于显式启用的实验功能，不默认添加依赖或打开配置。需要时请参考 [Nasti 官方文档](https://github.com/zixiao-labs/Nasti#react-pipeline)。

- **per-chunk CSS 抽取** —— 生产构建按 chunk 自动拆分 CSS、带 hash 文件名并注入 `<link>`，零配置。
- **实验性完整打包 dev 模式** —— SPA 模板（`react` / `react-tanstack` / `vue` / `solid`）内置 `dev:bundle` 脚本，走 Rolldown 原生 dev 引擎提供内存打包产物：

  ```bash
  npm run dev:bundle        # = nasti dev --bundle
  ```

  默认 `npm run dev` 仍是标准开发模式；`dev:bundle` 为 opt-in 尝鲜，HMR 行为以标准 `dev` 为准。

- **调试输出** —— 任意 `nasti` 命令都可加调试 flag 观察内部流程：

  ```bash
  nasti build --verbose         # 全部 nasti:* 命名空间
  nasti dev -d build,hmr        # 仅指定命名空间
  nasti dev -f rolldown         # 按内容过滤
  nasti build --logLevel warn   # 调日志级别
  ```

### TanStack Start

```bash
npm create nasti@latest my-fullstack-app -- --template react-start
# 或 --template solid-start
cd my-fullstack-app
npm run dev
npm run build
npm run preview
```

Start 模板直接使用 Nasti 原生 client / SSR 管线，不调用 Vite。默认从 `src/router.tsx` 的 `getRouter()` 和 `src/routes/` 生成入口，不需要 `index.html`；首页包含 server-function loader 和计数器，Solid 文档壳包含 `HydrationScript`。

这两个模板要求 **Node ≥22.12**。按 [Nasti 2.9 官方基线](https://github.com/zixiao-labs/Nasti/blob/v2.9.0/playground/tanstack-react/README.md)，Start runtime 固定为 1.169.4，`@tanstack/start-plugin-core` 固定为 **1.171.55**，`@tanstack/router-generator` 固定为 **1.167.46**。不要单独扩大这些版本范围：Nasti 依赖上游私有编译器契约。所有可选编译器均显式安装在生成的应用内。

生产构建输出 `dist/client/` 与 `dist/server/server.mjs`（导出 `{ fetch(request) }`），`nasti preview` 自动提供 SSR。**不要将整个 `dist/` 作为静态目录暴露**，只公开 `dist/client/`。生产平台部署适配由应用负责，preview 不等同于部署插件。

Start 开发模式通过原生客户端模块图提供 React / Solid Refresh，兼容的组件更新（含手工 lazy routes）保留状态；server function 与服务端依赖变化会更新服务端 bundle / RPC 清单并刷新 loader 数据，不重载整个页面。路由增删、环境变量变化、不兼容边界或构建错误恢复仍可能整页重载；服务端编译仍是串行完整构建，并非完全增量 SSR。不包含 RSC、自动路由分包、prerender / SPA mode 或第三方部署插件，也不要再叠加 `tanstackRouter()`。

### Redact（可选）

Redact 不默认启用，也不加入普通模板依赖。React 19 SPA / React Start 项目可显式安装上游已验证的版本：

```bash
npm install @tanstack/redact@0.2.1
```

```ts
// react-start 的 nasti.config.ts
import { defineConfig, tanstackStart, redact } from '@nasti-toolchain/nasti'

export default defineConfig({
  framework: 'react',
  plugins: [tanstackStart(), redact()],
})
```

普通 React SPA 在原配置中添加 `redact()` 即可；Nasti 会自动使用原生 bundled-dev 保持运行时身份一致。Redact 不适用于 Solid；普通 SSR 与浏览器使用相同语义，不代表完整替代 React 的兼容性保证。Start 必须保留 `hydration`、`context` 和 `classComponents` features，使用 `nano` preset 时需显式开启。

## 命令行选项

| 选项 | 说明 |
| --- | --- |
| `-t, --template <name>` | 指定模板：`react-tanstack` / `react` / `vue` / `solid` / `react-start` / `solid-start` / `electron-react` |
| `--pm <name>` | 指定包管理器：`npm` / `pnpm` / `yarn` / `bun`（默认自动探测） |
| `--install` / `--no-install` | 是否自动安装依赖（默认询问） |
| `--git` / `--no-git` | 是否执行 `git init`（默认询问） |
| `--overwrite` | 目标目录非空时清空后继续 |
| `-h, --help` | 查看帮助 |

## 包管理器

脚手架通过 `npm_config_user_agent` 自动探测你使用的包管理器（npm / pnpm / yarn / bun），安装命令与「下一步」提示都会与之匹配。也可用 `--pm` 显式指定。

安装依赖期间显示动态 spinner 和耗时；CI 中使用简化日志。安装失败会显示错误原因及最近的安装日志，并保留生成的项目和手动安装命令。按 Ctrl+C 可取消安装，不会继续初始化 Git 或显示成功提示。

## 系统要求

- Node.js **^20.19.0 或 ≥ 22.12.0**，与 Nasti / Rolldown 的运行要求一致（不支持 Node 21）。
- `react-start` / `solid-start` 模板另需 **Node ≥22.12**；旧 Node 会在生成文件、安装依赖前得到明确错误。
- `electron-react` 模板默认安装 **Electron ^41**，主进程 / Preload 的编译目标为 `node22`；这不等同于运行脚手架所需的宿主 Node 版本。

## 开发与验证

```bash
npm ci
npm run typecheck
npm test
npm run test:templates
```

`npm test` 覆盖七套模板生成、Start 的 Node 版本限制、原生 Router / Solid 配置、包管理器选择、安装期间 spinner 动画、安装失败 / 大量日志 / 取消等回归场景，不访问网络。

`test:templates` 在临时目录中逐一生成七套模板，联网安装真实依赖并验证生产构建、TypeScript 检查及开发入口。Start 额外验证 dev / preview 的 SSR、server-function loader、深层路由、客户端资源与非公开文件隔离。此脚本不运行浏览器 hydration / 点击测试。Electron 仅验证编译产物和渲染层，不下载或启动桌面二进制。

## License

[MIT](./LICENSE) - Made by [zixiao-labs](https://github.com/zixiao-labs)

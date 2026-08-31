<div align="center">

# create-nasti

**一行命令创建 [Nasti](https://github.com/zixiao-labs/Nasti) 项目**

*React + TanStack Router / React / Vue / Electron 开箱即用*

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
| `react-tanstack` | React + [TanStack Router](https://tanstack.com/router) 文件式路由，构建期自动代码分割（**头牌**） |
| `react` | 最小 React 单页应用 |
| `vue` | Vue 3 单文件组件（SFC） |
| `electron-react` | Electron 41+ 主进程 / Preload + React 渲染层，`dev` 直接启动桌面窗口 |

创建完成后：

```bash
cd my-app
npm install        # 若创建时未自动安装
npm run dev
```

Electron 模板中，`npm run dev` 启动桌面开发环境，`npm run build` 同时构建主进程、Preload 和渲染层。只调试渲染层时可运行 `npm run dev:renderer`；原有 `electron` / `electron:build` 脚本仍可使用。`preview` 仅预览 Web 渲染层，不会启动桌面窗口。

## Nasti 2.5 模板基线

脚手架生成的项目默认基于 **[Nasti](https://github.com/zixiao-labs/Nasti) ^2.5.2**（Rolldown / Oxc 驱动），会接收后续兼容的 2.x 更新。React 使用 ^19.2.8，Vue 与 `@vue/compiler-sfc` 使用匹配的 ^3.5.42 稳定版本，TanStack Router 使用 ^1.170.32，配套插件保持最新发布版 ^1.0.4。

模板保持最小配置，直接使用新版默认的 JSX / Fast Refresh、Vue SFC 与构建管线；React Compiler、RSC 和 Vue 3.6 Vapor Mode 属于显式启用的实验功能，不默认添加依赖或打开配置。需要时请参考 [Nasti 官方文档](https://github.com/zixiao-labs/Nasti#react-pipeline)。

- **per-chunk CSS 抽取** —— 生产构建按 chunk 自动拆分 CSS、带 hash 文件名并注入 `<link>`，零配置。
- **实验性完整打包 dev 模式** —— Web 模板（`react` / `react-tanstack` / `vue`）内置 `dev:bundle` 脚本，走 Rolldown 原生 dev 引擎提供内存打包产物：

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

## 命令行选项

| 选项 | 说明 |
| --- | --- |
| `-t, --template <name>` | 指定模板：`react-tanstack` / `react` / `vue` / `electron-react` |
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
- `electron-react` 模板默认安装 **Electron ^41**，主进程 / Preload 的编译目标为 `node22`；这不等同于运行脚手架所需的宿主 Node 版本。

## 开发与验证

```bash
npm ci
npm run typecheck
npm test
npm run test:templates
```

`npm test` 覆盖四套模板生成、包管理器选择、安装期间 spinner 动画、安装失败 / 大量日志 / 取消等回归场景，不访问网络。

`test:templates` 在临时目录中逐一生成四套模板，联网安装真实依赖并验证生产构建、TypeScript 检查及开发入口。Electron 仅验证编译产物和渲染层，不下载或启动桌面二进制。

## License

[MIT](./LICENSE) - Made by [zixiao-labs](https://github.com/zixiao-labs)

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
| `electron-react` | Electron 41+ 主进程 / Preload + React 渲染层 |

创建完成后：

```bash
cd my-app
npm install        # 若创建时未自动安装
npm run dev
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

## 系统要求

- Node.js **≥ 20**
- `electron-react` 模板需要 **Electron 41+**（捆绑 Node 22 / Chromium 138）

## License

[MIT](./LICENSE) - Made by [zixiao-labs](https://github.com/zixiao-labs)

import { contextBridge } from 'electron'

// 通过 contextBridge 安全地把少量信息暴露给渲染进程（window.app）
contextBridge.exposeInMainWorld('app', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
})

import { app, BrowserWindow } from 'electron'
import path from 'node:path'

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
    },
  })

  // 开发模式下 Nasti 通过环境变量传入 dev server URL；生产加载打包后的渲染层
  if (process.env.NASTI_DEV_SERVER_URL) {
    await win.loadURL(process.env.NASTI_DEV_SERVER_URL)
  } else {
    await win.loadFile(path.resolve(__dirname, 'renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fetchEastMoneyFundQuotes } from './eastmoneyFund'
import { fetchEastMoneyStockQuotes } from './eastmoneyStock'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const COLLAPSED_WIDTH = 240
const COLLAPSED_HEIGHT = 36

let mainWindow: BrowserWindow | null = null

function getTopCenterBounds(width: number, height: number) {
  const { workArea } = screen.getPrimaryDisplay()
  const x = Math.round(workArea.x + (workArea.width - width) / 2)
  return { x, y: workArea.y, width, height }
}

function createWindow() {
  const bounds = getTopCenterBounds(COLLAPSED_WIDTH, COLLAPSED_HEIGHT)

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 200,
    minHeight: 32,
    maxWidth: 640,
    maxHeight: 720,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: -100, y: -100 },
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setAlwaysOnTop(true, 'floating')

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function applyDockVisibility() {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide()
  }
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    applyDockVisibility()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('window:set-bounds', (_event, payload: { width: number; height: number }) => {
  if (!mainWindow) return
  const { width, height } = payload
  const next = getTopCenterBounds(Math.round(width), Math.round(height))
  mainWindow.setBounds(next, false)
})

ipcMain.handle('app:get-platform', () => process.platform)

ipcMain.handle('fund:fetch-quotes', async (_event, codes: unknown) => {
  if (!Array.isArray(codes)) {
    throw new Error('fund:fetch-quotes 需要字符串数组')
  }
  const list = codes.filter((item): item is string => typeof item === 'string')
  return fetchEastMoneyFundQuotes(list)
})

ipcMain.handle('stock:fetch-quotes', async (_event, codes: unknown) => {
  if (!Array.isArray(codes)) {
    throw new Error('stock:fetch-quotes 需要字符串数组')
  }
  const list = codes.filter((item): item is string => typeof item === 'string')
  return fetchEastMoneyStockQuotes(list)
})

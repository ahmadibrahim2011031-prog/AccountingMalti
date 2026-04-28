const { app, BrowserWindow, shell, Menu } = require('electron')
const { spawn, execSync } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')

const PORT = 3001
let mainWindow = null
let nextProcess = null
let isQuitting = false
let serverReady = false

// ── Single instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

// ── Logging ──────────────────────────────────────────────────────────────────
const logPath = path.join(app.getPath('userData'), 'malti.log')
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try { fs.appendFileSync(logPath, line) } catch (_) {}
  console.log(msg)
}

// ── App root (dev vs packaged) ───────────────────────────────────────────────
function getAppRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..')
}

// ── Kill any stale process on our port ───────────────────────────────────────
function freePort() {
  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { shell: true })
  } catch (_) {}
}

// ── Wait for Next.js ─────────────────────────────────────────────────────────
function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      http.get(`http://localhost:${PORT}`, () => resolve())
        .on('error', () => {
          if (++attempts >= retries) return reject(new Error('Server timeout'))
          setTimeout(check, 1000)
        })
    }
    setTimeout(check, 500)
  })
}

// ── Splash window ─────────────────────────────────────────────────────────────
function createSplash() {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  })

  const logoPath = path.join(getAppRoot(), 'public', 'malti-logo.png')
  const html = `<!DOCTYPE html><html><head><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#1e293b; border-radius:16px; display:flex; flex-direction:column;
           align-items:center; justify-content:center; height:100vh;
           font-family:-apple-system,BlinkMacSystemFont,sans-serif; color:white; overflow:hidden; }
    img { width:100px; height:100px; object-fit:contain; margin-bottom:20px; border-radius:16px; }
    h1 { font-size:22px; font-weight:700; margin-bottom:8px; }
    p { font-size:13px; color:#94a3b8; margin-bottom:30px; }
    .bar { width:200px; height:4px; background:#334155; border-radius:4px; overflow:hidden; }
    .fill { height:100%; background:linear-gradient(90deg,#3b82f6,#6366f1);
            border-radius:4px; animation:load 2s ease-in-out infinite; }
    @keyframes load { 0%{width:0%} 70%{width:90%} 100%{width:100%} }
  </style></head><body>
    <img src="file://${logoPath}" onerror="this.style.display='none'"/>
    <h1>Malti Accounting</h1><p>مالتي للمحاسبة</p>
    <div class="bar"><div class="fill"></div></div>
  </body></html>`

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  return splash
}

// ── Main window ───────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Malti Accounting',
    icon: path.join(getAppRoot(), 'public', 'malti-logo-512.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  Menu.setApplicationMenu(null)
  mainWindow.loadURL(`http://localhost:${PORT}`)

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  return mainWindow
}

// ── Start Next.js ─────────────────────────────────────────────────────────────
function startNextServer() {
  const appRoot = getAppRoot()
  const nextBin = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next')

  log(`Starting Next.js from: ${appRoot}`)
  log(`Next binary exists: ${fs.existsSync(nextBin)}`)

  nextProcess = spawn(process.execPath, [nextBin, 'start', '--port', String(PORT)], {
    cwd: appRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(PORT),
      NODE_ENV: 'production',
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      NEXTAUTH_URL_INTERNAL: `http://localhost:${PORT}`,
    },
  })

  nextProcess.stdout.on('data', (d) => log(`Next: ${d.toString().trim()}`))
  nextProcess.stderr.on('data', (d) => log(`Next: ${d.toString().trim()}`))
  nextProcess.on('error', (e) => log(`Next error: ${e.message}`))

  return waitForServer()
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  freePort()

  const splash = createSplash()

  try {
    await startNextServer()
    log('Next.js ready')
    serverReady = true

    const win = createMainWindow()
    win.once('ready-to-show', () => {
      splash.destroy()
      win.show()
      win.focus()
    })
  } catch (err) {
    log(`Failed: ${err.message}`)
    splash.destroy()
    app.quit()
  }

  // Register activate AFTER app is ready so BrowserWindow creation is safe
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('activate', () => {
    if (serverReady && mainWindow === null && !isQuitting) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  isQuitting = true
  if (nextProcess) nextProcess.kill('SIGTERM')
  app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  if (nextProcess) nextProcess.kill('SIGTERM')
})

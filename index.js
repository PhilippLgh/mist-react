const fs = require('fs')
const path = require('path')

const createRenderer = require('./electron-shell')
const Geth = require('./ethereum_clients/geth')
const { setupRpc } = require('./Rpc')
const { getMenuTemplate } = require('./Menu')

const {
  app,
  Menu,
  MenuItem,
  protocol,
  ipcMain,
  shell,
  dialog,
  nativeImage,
  BrowserWindow
} = require('electron')
// const { DialogUpdater, AppUpdater, createMenu } = require('@philipplgh/electron-app-updater')
const { AppManager } = require('@philipplgh/electron-app-manager')

// interface of log, warn, error
const logger = console

// hw acceleration can cause problem in VMs and in certain APIs
app.disableHardwareAcceleration()

/*

// setup updater for shell
const shellUpdater = new DialogUpdater({
  repo: 'https://github.com/PhilippLgh/mist-react',
  shell: true,
  auto: false,
  interval: 60,
  logger: logger
})
*/

const WindowManager = require('./WindowManager')
// TODO move into WindowManager
let mainWindow = null

const appManager = new AppManager({
  repository: 'https://github.com/ethereum/mist-ui',
  auto: false
})

const is = {
  dev: () =>
    process.env.NODE_ENV && process.env.NODE_ENV.trim() == 'development',
  prod: () => !is.dev()
}

const updateMenuVersion = async release => {
  const updateMenuMist = await appManager.updateMenuVersion(release.version)
  updateMenuMist.label = 'Mist UI'

  const template = getMenuTemplate()
  const UpdateMenu = template.find(mItem => mItem.label === 'Updater')
  UpdateMenu.submenu.push(
    updateMenuMist,
    { label: 'Geth' },
    { label: 'Shell' },
    { label: 'Settings' }
  )

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

const hotLoadLatest = async () => {
  const appUrl = await appManager.hotLoadLatest()
  if (appUrl === null) {
    // TODO display error
    return
  }
  const latest = appManager.hotLoadedApp

  updateMenuVersion(latest)

  const appWindow = WindowManager.createInsecureWindow()
  appWindow.loadURL(appUrl)
  // appWindow.setTitle(latest.name)
  // appWindow.webContents.openDevTools()
  mainWindow = appWindow
}

const initializeMenu = async geth => {
  const onReload = appUrl => {
    mainWindow.loadURL(appUrl)
  }
  const updateMenuMist = await appManager.createMenuTemplate(onReload)
  // console.log('mist menu', updateMenuMist)
  updateMenuMist.label = 'Mist UI'

  const gethUpdater = geth.getUpdater()
  const updateMenuGeth = await gethUpdater.createMenuTemplate(onReload)
  updateMenuGeth.label = 'Geth'

  // Create application menus
  const template = getMenuTemplate()
  const UpdateMenu = template.find(mItem => mItem.label === 'Updater')
  UpdateMenu.submenu.push(
    updateMenuMist,
    updateMenuGeth,
    { label: 'Shell' },
    { label: 'Settings' }
  )

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Step 0
const initialize = async geth => {
  // IMPORTANT don't await here: menu construction will defer startup
  initializeMenu(geth)
}

// Step 1
const startUI = async () => {
  if (is.dev()) {
    console.log('started in dev mode')
    const PORT = '3080'
    const startUrl = `http://localhost:${PORT}/index.html`
    mainWindow = createRenderer(startUrl)
  } else if (is.prod()) {
    console.log('started in prod mode')
    await hotLoadLatest()
  }
}

// ########## MAIN APP ENTRY POINT #########
const onReady = async () => {
  // 0 prepare windows, menus etc
  const geth = new Geth()
  await initialize(geth)

  // 1. start UI for quick user-feedback without long init procedures
  await startUI()

  // 2. make geth methods available in renderer
  // setupRpc('geth', geth)
  global.Geth = geth
  const gethBinary = await geth.getLocalBinary()
  if (gethBinary) {
    //geth.start(gethBinary)
  }
  // else do nothing: let user decide how to setup
}
app.once('ready', onReady)

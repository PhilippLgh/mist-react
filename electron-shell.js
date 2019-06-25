const path = require('path')
const url = require('url')
const Module = require('module')
const { app, shell } = require('electron')
const WindowManager = require('./WindowManager')

let win

function secureApplication() {
  // FIXME replace with correct origin
  let validOrigin = 'https://yourapp.com/'

  app.on('web-contents-created', (event, contents) => {
    // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      // Strip away preload scripts if unused or verify their location is legitimate
      delete webPreferences.preload
      delete webPreferences.preloadURL

      // Disable Node.js integration
      webPreferences.nodeIntegration = false

      // Verify URL being loaded
      if (!params.src.startsWith(validOrigin)) {
        event.preventDefault()
      }
    })

    // https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)
      if (parsedUrl.origin !== validOrigin) {
        event.preventDefault()
      }
    })

    // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
    contents.on('new-window', (event, navigationUrl) => {
      // In this example, we'll ask the operating system
      // to open this event's url in the default browser.
      event.preventDefault()

      shell.openExternal(navigationUrl)
    })
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

function createRenderer(clientUrl, options, args) {
  // secureApplication()

  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)
      // console.log('parsedUrl', parsedUrl)
      if (parsedUrl.protocol === 'https:') {
        shell.openExternal(navigationUrl)
      }
      event.preventDefault()
    })
  })

  const loadRenderer = () => {
    win = WindowManager.createWindow(options)
    win.args = args
    win.loadURL(clientUrl)
    // win.webContents.openDevTools()
  }

  if (app.isReady()) {
    loadRenderer()
  } else {
    app.once('ready', loadRenderer)
  }

  return win
}

module.exports = createRenderer

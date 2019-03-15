const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

class WindowManager {
  createInsecureWindow(options, data = {}) {
    const preloadPath = path.join(__dirname, 'preload.js')

    let baseOptions = {
      width: 1059,
      height: 658,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: true,
        webSecurity: false
      }
    }

    let win = new BrowserWindow(baseOptions)

    return win
  }

  createWindow(options = {}, data = {}) {
    const preloadPath = path.join(__dirname, 'preload.js')

    let baseOptions = {
      width: 800,
      height: 600
    }

    if (options.title) {
      baseOptions.title = options.title
    }

    let popupOptions = {
      // parent: win, // The child window will always show on top of the top window.
      modal: true
    }

    if (!fs.existsSync(preloadPath)) {
      throw new Error(
        'for security reasons application cannot be started without preload script: does not exist'
      )
    }

    // don't make any changes here
    let enforcedOptions = {
      webPreferences: {
        // https://electronjs.org/docs/tutorial/security#3-enable-context-isolation-for-remote-content
        contextIsolation: true,
        preload: preloadPath,
        // https://electronjs.org/docs/tutorial/security#2-disable-nodejs-integration-for-remote-content
        nodeIntegration: false,
        // https://electronjs.org/docs/tutorial/security#5-do-not-disable-websecurity
        webSecurity: true,
        // https://electronjs.org/docs/tutorial/security#7-do-not-set-allowrunninginsecurecontent-to-true
        allowRunningInsecureContent: false,
        // https://electronjs.org/docs/tutorial/security#8-do-not-enable-experimental-features
        experimentalFeatures: false,
        webviewTag: true, // needs to be set: defaults to nodeIntegration otherwise
        // https://electronjs.org/docs/tutorial/security#9-do-not-use-enableblinkfeatures
        enableBlinkFeatures: undefined // DO NOT USE
      }
    }

    // avoid potentially immutable or non-overwritable values on the passed options
    if (options && options.webPreferences) {
      delete options.webPreferences
      // TODO alert
    }

    let config = Object.assign(baseOptions, options)

    let isPopup = false
    if (isPopup) {
      config = Object.assign(config, popupOptions)
    }

    // must be last call to assign values to config - should overwrite existing values
    const windowConfig = Object.assign(config, enforcedOptions)

    let win = new BrowserWindow(windowConfig)

    let webContents = win.webContents

    // TODO https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-remote-require
    // TODO https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-remote-get-global
    webContents.on('crashed', () => {
      // TODO notify updater about bad app
      console.log('webpage crashed')
    })

    // https://github.com/electron/electron/issues/1594#issuecomment-105366717
    // if title is explicitly set don't let renderer overwrite it
    if (options.title) {
      win.on('page-title-updated', evt => {
        evt.preventDefault()
      })
    }

    // pass initial data to window
    win.data = JSON.stringify(data)

    win.update = changes => {
      win.webContents.send('__update', {
        ...changes
      })
    }

    return win
  }
}

module.exports = new WindowManager()

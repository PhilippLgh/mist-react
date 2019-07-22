const path = require('path')
const { menubar } = require('menubar')
const { Menu, shell } = require('electron')
const { registerGlobalPluginHost } = require('./ethereum_clients/PluginHost')
const { registerGlobalAppManager } = require('./grid_apps/AppManager')
const { registerGlobalUserConfig } = require('./Config')
const { registerPackageProtocol } = require('@philipplgh/electron-app-manager')
registerPackageProtocol()
registerGlobalUserConfig()

// auto-launch may start process with --hidden
const startMinimized = (process.argv || []).indexOf('--hidden') !== -1

let keepWindowOpen = false

const preloadPath = path.join(__dirname, 'preload.js')

const makePath = p =>
  (process.os !== 'windows' ? 'file://' : '') + path.normalize(p)

const mb = menubar({
  browserWindow: {
    alwaysOnTop: true, // good for debugging
    transparent: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    resizable: false,
    width: 320,
    height: 420,
    webPreferences: {
      preload: preloadPath
    },
    title: 'Grid Nano'
  },
  icon: path.resolve(`${__dirname}/build/IconTemplate.png`),
  index: makePath(`${__dirname}/ui/nano.html`),
  showDockIcon: true
})

const app = mb.app
// make sure every webview has nodeIntegration turned off and has only access to the API defined by
// preload-webview.js
app.on('web-contents-created', (event, contents) => {
  // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload
    delete webPreferences.preloadURL

    // console.log('will attach webview')

    webPreferences.preload = path.join(__dirname, 'preload-webview')

    // Disable Node.js integration
    webPreferences.nodeIntegration = false
  })
})

mb.on('ready', () => {
  const pluginHost = registerGlobalPluginHost()
  const appManager = registerGlobalAppManager()

  /* for testing:
  appManager.launch({
    name: 'grid-ui',
    args: {
      scope: {
        component: 'terminal',
        client: 'geth'
      }
    }
  })
  */

  // Unsure of linux distros behavior with menubar
  // so for now we will always show on launch
  // if (!startMinimized) {
  //   mb.showWindow()
  // }
  mb.showWindow()

  /*
  mb.window.webContents.openDevTools({
    mode: 'detach'
  })
  */
  mb.window.on('blur', function() {
    // it prevents window from hiding if keepWindowOpen is checked on tray's context menu
    !keepWindowOpen && mb.hideWindow()
  })
})

// right-click menu for tray
mb.on('after-create-window', function() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Keep window open',
      type: 'checkbox',
      checked: keepWindowOpen,
      click: () => {
        keepWindowOpen = !keepWindowOpen
      }
    },
    { type: 'separator' },
    {
      label: 'Feedback',
      click: () => {
        shell.openExternal(
          'https://docs.google.com/forms/d/e/1FAIpQLSeJ4BtbvDVSnIFCKG6TmJo_tbSZql-NBZHes_-M6SyTDTjP0Q/viewform'
        )
        mb.hideWindow()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        mb.app.quit()
      }
    }
  ])
  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(contextMenu)
  })
})

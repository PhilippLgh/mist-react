const path = require('path')
const { menubar } = require('menubar')
const { registerGlobalPluginHost } = require('./ethereum_clients/PluginHost')
const { registerGlobalAppManager } = require('./grid_apps/AppManager')
const { registerGlobalUserConfig } = require('./Config')

const createRenderer = require('./electron-shell')

const { registerPackageProtocol } = require('@philipplgh/electron-app-manager')
registerPackageProtocol()

registerGlobalUserConfig()

const preloadPath = path.join(__dirname, 'preload.js')

const makePath = p =>
  (process.os !== 'windows' ? 'file://' : '') + path.normalize(p)

const mb = menubar({
  index: makePath(`${__dirname}/ui/nano.html`),
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
    }
  },
  icon: path.resolve(`${__dirname}/build/IconTemplate.png`)
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

  mb.showWindow()
  mb.window.webContents.openDevTools()
})

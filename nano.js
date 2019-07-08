const path = require('path')
const { menubar } = require('menubar')
const { registerGlobalPluginHost } = require('./ethereum_clients/PluginHost')

const preloadPath = path.join(__dirname, 'preload.js')
const localFileProtocol = process.os !== 'windows' ? 'file://' : ''

const mb = menubar({
  index: path.join(localFileProtocol, __dirname, 'ui', 'nano.html'),
  browserWindow: {
    alwaysOnTop: true, // good for debugging
    webPreferences: {
      preload: preloadPath
    }
  },
  icon: path.join(__dirname, 'build', 'icon.png')
})

mb.on('ready', () => {
  const pluginHost = registerGlobalPluginHost()
  mb.showWindow()
  mb.window.webContents.openDevTools()
})

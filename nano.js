const path = require('path')
const { menubar } = require('menubar')
const { registerGlobalPluginHost } = require('./ethereum_clients/PluginHost')

const preloadPath = path.join(__dirname, 'preload.js')

const makePath = p =>
  (process.os !== 'windows' ? 'file://' : '') + path.normalize(p)

const mb = menubar({
  index: makePath(`${__dirname}/ui/nano.html`),
  browserWindow: {
    alwaysOnTop: true, // good for debugging
    webPreferences: {
      preload: preloadPath
    }
  },
  icon: path.resolve(`${__dirname}/build/IconTemplate.png`)
})

mb.on('ready', () => {
  const pluginHost = registerGlobalPluginHost()
  mb.showWindow()
  mb.window.webContents.openDevTools()
})

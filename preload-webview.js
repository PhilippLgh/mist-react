const { ipcRenderer, remote, webFrame } = require('electron')
const { dialog } = remote
const { notify, showOpenDialog } = require('./utils/renderer/electron')

const PluginHost = remote.getGlobal('PluginHost')

const currentWindow = remote.getCurrentWindow()
const { app } = currentWindow.args

const pluginInterface = plugin => {
  return {
    name: plugin.name,
    displayName: plugin.displayName,
    type: plugin.type,
    sendRpc: async (method, params) => {
      return plugin.rpc(method, params)
    },
    getState: () => {
      return plugin.state
    },
    execute: command => {
      return plugin.execute(command)
    },
    start: () => {
      plugin.requestStart(app)
    },
    stop: () => {
      console.log('app requested stop')
    },
    on: (eventName, handler) => {
      return plugin.on(eventName, handler)
    },
    off: (eventName, handler) => {
      return plugin.removeListener(eventName, handler)
    }
  }
}

window.grid = {
  version: '0.1.0',
  getAllPlugins: () => {
    return PluginHost.getAllPlugins().map(plugin => pluginInterface(plugin))
  },
  getClient: name => {
    const plugin = PluginHost.getAllPlugins().find(p => p.name === name)
    return plugin ? pluginInterface(plugin) : plugin
  },
  notify,
  showOpenDialog
}

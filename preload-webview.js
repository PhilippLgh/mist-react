const { ipcRenderer, remote, webFrame } = require('electron')
const { dialog } = remote
const { notify, showOpenDialog } = require('./utils/renderer/electron')

const PluginHost = remote.getGlobal('PluginHost')

const currentWindow = remote.getCurrentWindow()
const { app } = currentWindow.args

const clientInterface = client => {
  return {
    name: client.name,
    displayName: client.displayName,
    type: client.type,
    sendRpc: async (method, params) => {
      return client.rpc(method, params)
    },
    getState: () => {
      return client.state
    },
    execute: command => {
      return client.execute(command)
    },
    start: () => {
      client.requestStart(app)
    },
    stop: () => {
      console.log('app requested stop')
    },
    on: (eventName, handler) => {
      return client.on(eventName, handler)
    },
    off: (eventName, handler) => {
      return client.removeListener(eventName, handler)
    }
  }
}

window.grid = {
  version: '0.1.0',
  getAllPlugins: () => {
    return PluginHost.getAllPlugins().map(client => clientInterface(client))
  },
  getClient: name => {
    let client = PluginHost.getAllPlugins().find(p => p.name === name)
    return client ? clientInterface(client) : client
  },
  notify,
  showOpenDialog
}

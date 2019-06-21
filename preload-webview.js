const { ipcRenderer, remote, webFrame } = require('electron')
const { notify, showOpenDialog } = require('./utils/renderer/electron')

const PluginHost = remote.getGlobal('PluginHost')

const clientInterface = client => {
  return {
    name: client.name,
    displayName: client.displayName,
    sendRpc: async (method, params) => {
      return client.rpc(method, params)
    },
    getState: () => {
      return client.state
    },
    execute: command => {
      client.execute(command)
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
    return {
      sendRpc: async (method, params) => {
        return client.rpc(method, params)
      },
      getState: () => {
        return client.state
      },
      execute: command => {
        client.execute(command)
      },
      on: (eventName, handler) => {
        return client.on(eventName, handler)
      },
      off: (eventName, handler) => {
        return client.removeListener(eventName, handler)
      }
    }
  },
  notify,
  showOpenDialog
}

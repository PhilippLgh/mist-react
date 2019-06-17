const { ipcRenderer, remote, webFrame } = require('electron')
const { notify, openFolderDialog } = require('./utils/renderer/electron')

const PluginHost = remote.getGlobal('PluginHost')

window.grid = {
  version: '0.1.0',
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
  openFolderDialog
}

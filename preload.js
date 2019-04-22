const { ipcRenderer, remote, webFrame } = require('electron')
const { dialog } = require('electron').remote

// const rpc = require('./Rpc')

// const thisWin = remote.getCurrentWindow()

// see contextIsolation for more info:
// pass the initial data to the isolated window context and de-serialize it:
/*
webFrame.executeJavaScript(`
  window.data = ${thisWin.data}
  try {
    // window.data = JSON.parse(window.data)
  } catch (error) {
    console.error(error)
  }
`)

ipcRenderer.on('__update', async (event, data) => {
  let dataString = JSON.stringify(data)
  let result = await webFrame.executeJavaScript(`
    try {
      window.dispatchEvent(new CustomEvent('update', {detail: ${dataString} }));
    } catch (error) {
      console.error(error)
    }
  `)
})
*/

// https://developer.chrome.com/extensions/content_scripts#host-page-communication
/*
window.addEventListener('message', function(event) {
  console.log('received event', event)
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    console.log("Content script received: " + event.data.text);
  }
}, false);
*/
console.log('preload loaded')

const openFolderDialog = defaultPath => {
  return new Promise((resolve, reject) => {
    const options = {
      defaultPath,
      properties: ['openDirectory', 'showHiddenFiles']
    }
    dialog.showOpenDialog(options, filePaths => {
      if (!filePaths || filePaths.length === 0) {
        reject('No selection')
        return
      }
      resolve(filePaths[0])
    })
  })
}

const Mist = {
  PluginHost: remote.getGlobal('PluginHost'),
  window: {
    getArgs: () => {}
  },
  openFolderDialog
}

/*
const Geth = {
  checkForUpdates: async () => {
    return rpc.send("geth.checkForUpdates")
  },
  setConfig: async config => {
    return rpc.send("geth.setConfig", config)
  },
  getConfig: async () => {
    return rpc.send("geth.getConfig")
  },
  getStatus: async () => {
    return rpc.send("geth.getStatus")
  },
  getReleases: async () => {
    return rpc.send("geth.getReleases")
  },
  start: async () => {
    return rpc.send("geth.start")
  },
  stop: async () => {
    return rpc.send("geth.stop")
  },
  version: async () => {
    return rpc.send("geth.version")
  },
  rpc: async (call) => {
    return rpc.send("geth.rpc", call)
  }
}
const Mist = {
  geth: Geth
}
*/
window.Mist = Mist

/*
webFrame.executeJavaScript(`window.Mist = {geth: {
  getStatus: () => {return{}},
  getConfig: () => {return{}}
}}`)
*/

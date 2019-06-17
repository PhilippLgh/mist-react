const { remote } = require('electron')
const { dialog } = require('electron').remote

const notify = (title, body) => {
  const notification = new Notification(title, { body })
  notification.onclick = () => {
    const window = remote.getCurrentWindow()
    if (window) {
      window.show()
    }
  }
}

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

module.exports = {
  notify,
  openFolderDialog
}

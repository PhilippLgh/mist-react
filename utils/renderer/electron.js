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

const showOpenDialog = (
  pathType = 'file',
  selectMultiple = false,
  defaultPath
) => {
  return new Promise((resolve, reject) => {
    const options = {
      properties: ['showHiddenFiles']
    }
    if (pathType === 'directory') {
      options.properties.push('openDirectory')
    } else {
      options.properties.push('openFile')
    }
    if (selectMultiple) {
      options.properties.push('multiSelections')
    }
    if (defaultPath) {
      options.defaultPath = defaultPath
    }
    dialog.showOpenDialog(options, filePaths => {
      if (!filePaths || filePaths.length === 0) {
        reject('No selection')
        return
      }
      resolve(filePaths.join(','))
    })
  })
}

module.exports = {
  notify,
  showOpenDialog
}

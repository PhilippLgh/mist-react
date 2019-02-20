// TODO executed before electron builder builds: copies or downloads with app-updater a version of the latest .asar to this dir for shipping
// TODO make sure there is not more than one asar present

const path = require('path')
const { AppManager } = require('@philipplgh/electron-app-manager')

const updater = new AppManager({
  repository: 'https://github.com/ethereum/mist-ui'
})

;(async function() {
  const latest = await updater.getLatest()
  await updater.download(latest, true, path.join(__dirname, '..'))
})()

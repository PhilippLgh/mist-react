/**
 *
 */
const path = require('path')
const { AppManager } = require('@philipplgh/electron-app-manager')

const updater = new AppManager({
  repository: 'https://github.com/ethereum/grid-ui'
})

;(async function() {
  const latest = await updater.getLatestRemote()
  await updater.download(latest, {
    targetDir: path.join(__dirname, '..', 'cached-grid-ui'),
    writeDetachedMetadata: false
  })
})()

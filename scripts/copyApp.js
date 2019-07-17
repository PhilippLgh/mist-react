/**
 *
 */
const { getShippedGridUiPath } = require('../utils/main/util')
const { AppManager } = require('@philipplgh/electron-app-manager')

const updater = new AppManager({
  repository: 'https://github.com/ethereum/grid-ui',
  auto: false
})

const GRID_UI_CACHE = getShippedGridUiPath()

;(async function() {
  const latest = await updater.getLatestRemote()
  await updater.download(latest, {
    targetDir: GRID_UI_CACHE,
    writeDetachedMetadata: false
  })
})()

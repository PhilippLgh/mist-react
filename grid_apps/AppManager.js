const createRenderer = require('../electron-shell')
const WindowManager = require('../WindowManager')

class AppManager {
  getAvailableApps() {
    const apps = require('./apps.json')
    return apps
  }
  launch(app) {
    console.log('launch', app.name)
    let url = app.url || 'http://localhost:3000'
    const mainWindow = createRenderer(WindowManager.getMainUrl(), {
      url,
      isApp: true
    })
  }
}

const registerGlobalAppManager = () => {
  global.AppManager = new AppManager()
  return global.AppManager
}

module.exports.registerGlobalAppManager = registerGlobalAppManager

module.exports.AppManager = AppManager

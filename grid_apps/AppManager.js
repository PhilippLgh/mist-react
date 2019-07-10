const { EventEmitter } = require('events')
const path = require('path')
const createRenderer = require('../electron-shell')
const WindowManager = require('../WindowManager')
const { AppManager: Downloader } = require('@philipplgh/electron-app-manager')

const { getUserConfig } = require('../Config')
const UserConfig = getUserConfig()

class AppManager extends EventEmitter {
  constructor() {
    super()
  }
  async getAppsFromRegistries() {
    let apps = []
    try {
      const registries = UserConfig.getItem('registries', [])
      for (let index = 0; index < registries.length; index++) {
        const registry = registries[index]
        try {
          const result = await Downloader.downloadJson(registry)
          apps = [...apps, ...result.apps]
        } catch (error) {
          console.log('could not load apps from registry:', registry, error)
        }
      }
    } catch (error) {
      console.log('could not load apps from registries', error)
    }
    return apps
  }
  getAppsFromAppsJson() {
    let apps = []
    try {
      const _apps = require('./apps.json')
      apps = [..._apps]
    } catch (error) {
      console.log('error: could not parse apps.json', error)
    }
    return apps
  }
  getAppsFromConfig() {
    let apps = []
    try {
      const _apps = UserConfig.getItem('apps', [])
      apps = [..._apps]
    } catch (error) {
      console.log('could not read user-defined apps', error)
    }
    return apps
  }
  // @deprecated
  getAvailableApps() {
    return this.getAppsFromAppsJson()
  }
  async getAllApps() {
    let apps = []
    const appsJson = await this.getAppsFromAppsJson()
    const appsConfig = await this.getAppsFromConfig()
    const appsRegistries = await this.getAppsFromRegistries()
    apps = [...appsJson, ...appsConfig, ...appsRegistries]
    return apps
  }
  launch(app) {
    console.log('launch', app.name)

    if (app.id) {
      const win = WindowManager.getById(app.id)
      if (win) {
        win.show()
        return win.id
      }
    }

    if (app.name === 'grid-ui') {
      const { args } = app
      // const appUrl = 'package://github.com/ethereum/grid-ui'
      let appUrl = 'http://localhost:3080/'
      const { scope } = args
      const { client: clientName, component } = scope
      if (component === 'terminal') {
        appUrl = `file://${path.join(__dirname, '..', 'ui', 'terminal.html')}`
      }
      const clientDisplayName = 'Geth'
      let mainWindow = createRenderer(
        appUrl,
        {
          x: 400,
          y: 400
        },
        {
          scope: {
            component: component,
            client: clientName
          }
        }
      )
      mainWindow.setMenu(null)
      mainWindow.setTitle('Ethereum Grid Terminal for ' + clientDisplayName)
      return mainWindow.id
    }

    let url = app.url || 'http://localhost:3000'
    const mainWindow = createRenderer(
      WindowManager.getMainUrl(),
      {},
      {
        url,
        isApp: true,
        app
      }
    )
  }
  hide(windowId) {
    return WindowManager.hide(windowId)
  }
}

const registerGlobalAppManager = () => {
  global.AppManager = new AppManager()
  return global.AppManager
}

module.exports.registerGlobalAppManager = registerGlobalAppManager

module.exports.AppManager = AppManager

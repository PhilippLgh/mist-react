const { EventEmitter } = require('events')
const fs = require('fs')
const path = require('path')
const createRenderer = require('../electron-shell')
const WindowManager = require('../WindowManager')
const {
  AppManager: PackageManager
} = require('@philipplgh/electron-app-manager')

const { getUserConfig } = require('../Config')
const UserConfig = getUserConfig()

const is = require('../utils/main/is')
const generateFlags = require('../utils/flags')
const {
  checkConnection,
  getShippedGridUiPath,
  getCachePath
} = require('../utils/main/util')

const GRID_UI_CACHE = getCachePath('grid-ui')

// console.log('grid ui cache created at', GRID_UI_CACHE)

const gridUiManager = new PackageManager({
  repository: 'https://github.com/ethereum/grid-ui',
  auto: true, // this will automatically check for new packages...
  intervalMins: 60, // ...every 60 minutes. the first check will be after 1 minute though
  cacheDir: GRID_UI_CACHE, // updates are automatically downloaded to this path
  searchPaths: is.prod() ? [getShippedGridUiPath()] : undefined, // tell app-manager also to look for shipped packages
  logger: require('debug')('GridPackageManager'),
  policy: {
    onlySigned: false
  }
})

gridUiManager.on('update-downloaded', release => {
  console.log('a new grid-ui version was downloaded:', release.version)
  // TODO we can use this event to inform the user to restart
})

const getGridUiUrl = async () => {
  let useHotLoading = true // temporary fix from philipp
  let version = 'latest'
  try {
    let packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    )
    version = `~${packageJson.version}` // pin grid-ui version to grid version range
  } catch (error) {
    console.log('WARNING: package.json parse error', error)
  }
  const HOT_LOAD_URL = `package://github.com/ethereum/grid-ui?version=${version}`
  // const HOT_LOAD_URL = `package://github.com/ethereum/grid-ui`
  if (is.dev()) {
    const PORT = '3080'

    const appUrl = `http://127.0.0.1:${PORT}/index.html`
    const isServerRunning = await checkConnection('127.0.0.1', PORT)
    /**
     * check if grid-ui is started and the server is running.
     * otherwise load latest grid-ui package from github ("hot-load")
     */
    if (isServerRunning) {
      return appUrl
    } else {
      console.log(
        'WARNING: grid ui webserver not running - fallback to hot-loading'
      )
      return HOT_LOAD_URL
    }
  } else {
    // production:
    if (useHotLoading) {
      return HOT_LOAD_URL
    } // else: use caching
    console.log('check for cached packages')
    let packagePath = ''
    try {
      // with the argument we can provide additional search paths besides cache
      const cached = await gridUiManager.getLatestCached()
      if (!cached) {
        console.warn(
          'WARNING: no cached packages found. fallback to hot-loading'
        )
        useHotLoading = true
      } else {
        console.log('package location', cached.location)
        packagePath = cached.location
      }
    } catch (error) {
      console.log('error during check', error)
    }

    // fallback necessary?
    if (useHotLoading || !packagePath) {
      return HOT_LOAD_URL
    }

    let appUrl = await gridUiManager.load(packagePath)
    console.log(packagePath)
    console.log(gridUiManager.load)
    console.log('app url: ' + appUrl)
    return appUrl
  }
}

class AppManager extends EventEmitter {
  constructor() {
    super()
  }
  async getAppsFromRegistries() {
    let apps = []
    try {
      const registries = UserConfig.getItem('registries', [])
      if (registries === undefined) {
        // key does not exist in config
        return apps
      }
      for (let index = 0; index < registries.length; index++) {
        const registry = registries[index]
        try {
          const result = await PackageManager.downloadJson(registry)
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
  async _startDependency(app, dependency) {
    console.log('Found dependency: ', dependency)
    const plugin = global.PluginHost.getPluginByName(dependency.name)
    if (!plugin) {
      console.log('Could not find necessary plugin.')
    } else if (plugin.isRunning) {
      console.log(`Plugin ${plugin.name} already running.`)
    } else {
      // TODO: error handling of malformed settings
      const settings = plugin.settings || []
      let config = {}

      // 1. set default => check buildPluginDefaults in grid-ui
      // TODO: this code should not be duplicated
      settings.forEach(setting => {
        if ('default' in setting) {
          config[setting.id] = setting.default
        }
      })

      // 2. TODO respect persisted user settings
      const persistedConfig = (await UserConfig.getItem('settings')) || {}
      const persistedPluginConfig = persistedConfig[plugin.name]
      config = Object.assign({}, config)

      // 3. overwrite configs with required app settings
      dependency.settings.forEach(setting => {
        config[setting.id] = setting.value
      })

      const flags = generateFlags(config, settings)
      const release = undefined // TODO: allow apps to choose specific release?
      console.log('Request start: ', app, flags, release)
      try {
        // TODO: show progress to user
        await plugin.requestStart(app, flags, release)
      } catch (error) {
        // e.g. user cancelled
        console.log('Error: ', error)
        return // do NOT start in this case
      }
    }
  }
  async launch(app) {
    console.log(`Launch app: ${app.name}`)

    if (app.windowId) {
      const win = WindowManager.getById(app.windowId)
      if (win) {
        win.show()
        return win.id
      }
    }

    const { dependencies } = app
    if (dependencies) {
      for (const dependency of dependencies) {
        try {
          await this._startDependency(app, dependency)
          console.log('dependency started')
        } catch (error) {
          console.log(
            'ERROR: aborting app start - dependency could not be started',
            error
          )
          // abort app start if one dependency fails to start & let user know
          return
        }
      }
    }

    if (app.name === 'grid-ui') {
      const { args } = app
      let appUrl = await getGridUiUrl()
      const { scope } = args
      const { plugin: pluginName, component } = scope
      if (component === 'terminal') {
        appUrl = `file://${path.join(__dirname, '..', 'ui', 'terminal.html')}`
      }
      let mainWindow = createRenderer(
        appUrl,
        {
          backgroundColor: component === 'terminal' ? '#1E1E1E' : '#202225',
          title: 'Grid'
        },
        { scope }
      )
      // mainWindow.removeMenu()
      /*
      mainWindow.webContents.openDevTools({
        mode: 'detach'
      })
      */
      return mainWindow.id
    }

    let url = app.url || 'http://localhost:3000'
    const mainWindow = createRenderer(
      await getGridUiUrl(), // FIXME might be very inefficient. might load many grid-ui packages into memory!!
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

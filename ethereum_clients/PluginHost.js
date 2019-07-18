const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')
const { AppManager } = require('@philipplgh/electron-app-manager')
const { Plugin, PluginProxy } = require('./Plugin')
const { getPluginCachePath } = require('./util')
const { getUserConfig } = require('../Config')
const generateFlags = require('../utils/flags')

function requireFromString(src, filename) {
  var Module = module.constructor
  var m = new Module()
  m._compile(src, filename)
  return m.exports
}

const UserConfig = getUserConfig()

// TODO add file to electron packaged files
class PluginHost extends EventEmitter {
  constructor() {
    super()
    this.plugins = []
    this.pluginProxies = {}
    this.discover()
      .then(plugins => {
        this.plugins = this.plugins.concat(plugins)
        // TODO emit plugins discovered
      })
      .catch(err => console.log('plugins could not be loaded', err))

    this.discoverRemote()
      .then(plugins => {
        this.plugins = this.plugins.concat(plugins)
        console.log(`${plugins.length} remote plugins found`)
      })
      .catch(err => {
        console.log('remote plugins could not be loaded', err)
      })
      .then(() => {
        this.setDefaultFlags()
      })
      .finally(() => {
        this.emit('plugins-loaded')
      })
  }
  setDefaultFlags() {
    const persistedFlags = UserConfig.getItem('flags')
    const newFlags = Object.assign({}, persistedFlags)

    this.plugins.forEach(plugin => {
      if (!persistedFlags || !persistedFlags[plugin.name]) {
        try {
          let pluginDefaults = {}
          const settings = plugin.config.settings
          settings.forEach(setting => {
            if ('default' in setting) {
              pluginDefaults[setting.id] = setting.default
            }
          })
          const flags = generateFlags(pluginDefaults, settings)
          console.log(`Generated flags for ${plugin.name}:`, flags)

          newFlags[plugin.name] = flags
        } catch (e) {
          console.log('Insufficient settings to build flags for', plugin.name)
        }
      } else {
        console.log(`Flags found for ${plugin.name}`)
      }
    })

    UserConfig.setItem('flags', newFlags)
  }
  loadPluginFromFile(fullPath) {
    const source = fs.readFileSync(fullPath, 'utf8')
    const pluginConfig = require(fullPath)
    // 2. TODO validate / verify
    const plugin = new Plugin(pluginConfig, source)
    return plugin
  }
  async loadPluginFromPackage(pluginManager, pkg) {
    const index = await pluginManager.getEntry(pkg, 'package/index.js')
    const source = (await index.file.readContent()).toString()
    // FIXME this needs to be separated into an installation step after user's has checked that code looks legit and everything is fine
    const pluginConfig = requireFromString(
      source,
      `${pkg.location}/package/index.js`
    )
    const plugin = new Plugin(pluginConfig, source, pkg)
    return plugin
  }
  async getPluginsFromRegistries() {
    let plugins = []
    try {
      const registries = UserConfig.getItem('registries', [])
      for (let index = 0; index < registries.length; index++) {
        const registry = registries[index]
        try {
          const result = await AppManager.downloadJson(registry)
          plugins = [...plugins, ...result.plugins]
        } catch (error) {
          console.log('could not load plugins from registry:', registry, error)
        }
      }
    } catch (error) {
      console.log('could not load plugins from registries', error)
    }
    return plugins
  }
  async getPluginsFromPluginsJson() {
    let plugins = []
    try {
      const PLUGIN_DIR = path.join(__dirname, 'client_plugins')
      plugins = JSON.parse(
        fs.readFileSync(path.join(PLUGIN_DIR, 'plugins.json'))
      )
    } catch (error) {
      console.log('error: could not parse plugin.json list', error)
    }
    return plugins
  }
  async getPluginsFromConfig() {
    const plugins = UserConfig.getItem('plugins', [])
    return plugins
  }
  async discoverRemote() {
    const configPlugins = await this.getPluginsFromConfig()
    const pluginsJsonPlugins = await this.getPluginsFromPluginsJson()
    const pluginsRegistries = await this.getPluginsFromRegistries()

    const pluginList = [
      ...pluginsJsonPlugins,
      ...configPlugins,
      ...pluginsRegistries
    ]
    let releases = pluginList.map(async pluginShortInfo => {
      try {
        const { name: pluginName, location } = pluginShortInfo
        if (!location) {
          throw new Error(
            `error: external plugin ${pluginName} does not specify a valid location`
          )
        }
        if (fs.existsSync(location)) {
          // load package from provided path
          // FIXME allow this only in dev mode
          if (fs.statSync(location).isDirectory()) {
            // TODO plugin can be named differently and specified in package.json
            const plugin = this.loadPluginFromFile(
              path.join(location, 'index.js')
            )
            return plugin
          } else {
            const plugin = this.loadPluginFromFile(location)
            return plugin
          }
        } else {
          const pluginManager = new AppManager({
            repository: location,
            auto: false,
            paths: [],
            cacheDir: getPluginCachePath(pluginShortInfo.name)
          })
          // load package from cache or server:
          let latest = await pluginManager.getLatest()
          if (!latest) {
            return undefined
          }
          // download if necessary -> no cached found
          if (latest.remote) {
            latest = await pluginManager.download(latest)
            if (!latest) {
              throw new Error(
                `error: plugin ${pluginName} could not be fetched`
              )
            }
          }
          // plugin verification necessary for remote plugins:
          if (!latest.verificationResult) {
            throw new Error(
              `error: external plugin ${pluginName} has no verification info`
            )
          }
          const { isValid, isTrusted } = latest.verificationResult
          if (!isValid) {
            throw new Error(
              `error: ${pluginName} has invalid plugin signature - unsigned or corrupt?`
            )
          }
          if (!isTrusted) {
            console.log(
              `WARNING: the plugin ${pluginName} is signed but the author's key is unknown`
            )
          }
          const plugin = await this.loadPluginFromPackage(pluginManager, latest)
          return plugin
        }
        return undefined
      } catch (error) {
        const { name: pluginName } = pluginShortInfo
        console.log(
          `error: remote plugin ${pluginName} could not be loaded`,
          error
        )
        return undefined
      }
    })
    const plugins = await Promise.all(releases)
    return plugins.filter(p => p !== undefined)
  }
  async discover() {
    const PLUGIN_DIR = path.join(__dirname, 'client_plugins')
    const pluginFiles = fs.readdirSync(PLUGIN_DIR)
    console.time('plugin init')
    const plugins = []
    pluginFiles.forEach(f => {
      if (!f.endsWith('.js')) return
      try {
        const fullPath = path.join(PLUGIN_DIR, f)
        const plugin = this.loadPluginFromFile(fullPath)
        plugins.push(plugin)
      } catch (error) {
        console.log(`plugin ${f} could not be loaded`, error)
      }
    })
    console.timeEnd('plugin init')
    return plugins
  }
  getAllMetadata() {
    return this.plugins.map(p => p.config)
  }
  // called from renderer
  getAllPlugins(bustCache = false) {
    return this.plugins.map(plugin => {
      if (this.pluginProxies[plugin.name] && !bustCache) {
        return this.pluginProxies[plugin.name]
      } else {
        const pluginProxy = new PluginProxy(plugin)
        this.pluginProxies[plugin.name] = pluginProxy
        return pluginProxy
      }
    })
  }
  getPluginByName(name) {
    return this.getAllPlugins().find(plugin => plugin.name === name)
  }
  start(name) {
    console.log('start plugin', name)
  }
  stop(name) {
    console.log('stop plugin', name)
  }
}

const registerGlobalPluginHost = () => {
  global.PluginHost = new PluginHost()
  return global.PluginHost
}

module.exports.registerGlobalPluginHost = registerGlobalPluginHost

module.exports.PluginHost = PluginHost

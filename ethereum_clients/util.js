const fs = require('fs')
const path = require('path')
const { AppManager } = require('@philipplgh/electron-app-manager')

const getUserDataPath = () => {
  const USER_DATA_PATH =
    'electron' in process.versions
      ? require('electron').app.getPath('userData')
      : path.join(process.env.APPDATA, 'grid')
  if (!fs.existsSync(USER_DATA_PATH)) {
    fs.mkdirSync(USER_DATA_PATH)
  }
  return USER_DATA_PATH
}

const getPluginCachePath = name => {
  let CLIENT_PLUGINS

  if (process.env.NODE_ENV === 'test') {
    CLIENT_PLUGINS = path.join(__dirname, `client_plugins`)
  } else if (process.env.NODE_ENV === 'development') {
    CLIENT_PLUGINS = path.join(__dirname, `client_plugins`)
  } else {
    const USER_DATA_PATH = getUserDataPath()
    CLIENT_PLUGINS = path.join(USER_DATA_PATH, `client_plugins`)
  }

  if (!fs.existsSync(CLIENT_PLUGINS)) {
    fs.mkdirSync(CLIENT_PLUGINS)
  }

  const cachePath = path.join(CLIENT_PLUGINS, name)
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath)
  }

  return cachePath
}

const getCachePath = name => {
  let cachePath
  if (process.env.NODE_ENV === 'test') {
    cachePath = path.join(__dirname, '/../test', 'fixtures', `bin_${name}`)
  } else if (process.env.NODE_ENV === 'development') {
    cachePath = path.join(__dirname, `bin_${name}`)
  } else {
    const USER_DATA_PATH = getUserDataPath()
    cachePath = path.join(USER_DATA_PATH, `bin_${name}`)
  }

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath)
  }

  return cachePath
}

const getBinaryUpdater = (repo, name, filter, prefix, cachePath) => {
  let includes = []
  let excludes = []

  if (filter && filter.name) {
    const { name } = filter
    excludes = name.excludes
    includes = name.includes
  }

  if (!cachePath) {
    cachePath = getCachePath(name)
  }

  return new AppManager({
    repository: repo,
    auto: false,
    paths: [],
    cacheDir: cachePath,
    filter: ({ fileName }) => {
      fileName = fileName.toLowerCase()
      return (
        (!includes || includes.every(val => fileName.indexOf(val) >= 0)) &&
        (!excludes || excludes.every(val => fileName.indexOf(val) === -1))
      )
    },
    prefix
  })
}

const generateFlags = (userConfig, nodeSettings) => {
  if (!Array.isArray(nodeSettings)) throw 'Settings must be an Array instance'

  const userConfigEntries = Object.keys(userConfig)

  let flags = []

  userConfigEntries.map(e => {
    let flag
    let configEntry = nodeSettings.find(s => s.id === e)
    let flagStr = configEntry.flag

    if (flagStr) {
      flag = flagStr.replace(/%s/, userConfig[e]).split(' ')
    } else if (configEntry.options) {
      const options = configEntry.options
      const selectedOption = options.find(
        f => userConfig[e] === f.value || userConfig[e] === f
      )

      if (typeof selectedOption['flag'] !== 'string') {
        throw `Option "${selectedOption.value ||
          selectedOption}" must have the "flag" key`
      }

      flag = selectedOption.flag.replace(/%s/, userConfig[e]).split(' ')
    } else {
      throw `Config entry "${e}" must have the "flag" key`
    }

    flags = flags.concat(flag)
  })

  return flags.filter(e => e.length > 0)
}

module.exports = {
  generateFlags,
  getCachePath,
  getPluginCachePath,
  getBinaryUpdater
}

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

module.exports = {
  getCachePath,
  getPluginCachePath,
  getBinaryUpdater
}

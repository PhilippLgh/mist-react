const fs = require('fs')
const path = require('path')
const { AppManager } = require('@philipplgh/electron-app-manager')
const net = require('net')

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
  const USER_DATA_PATH = getUserDataPath()

  if (process.env.NODE_ENV === 'test') {
    CLIENT_PLUGINS = path.join(__dirname, `client_plugins`)
  } else if (process.env.NODE_ENV === 'development') {
    // CLIENT_PLUGINS = path.join(__dirname, `client_plugins`)
    CLIENT_PLUGINS = path.join(USER_DATA_PATH, `client_plugins`)
  } else {
    CLIENT_PLUGINS = path.join(USER_DATA_PATH, `client_plugins`)
  }
  const cachePath = path.join(CLIENT_PLUGINS, name)
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true })
  }

  return cachePath
}

const getCachePath = name => {
  let cachePath
  if (process.env.NODE_ENV === 'test') {
    cachePath = path.join(__dirname, '/../test', 'fixtures')
  } else {
    const USER_DATA_PATH = getUserDataPath()
    cachePath = path.join(USER_DATA_PATH, 'cache')
  }
  if (name) {
    cachePath = path.join(cachePath, name)
  }
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true })
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
    cachePath = getCachePath(`bin/bin_${name}`)
  }

  return new AppManager({
    repository: repo,
    auto: false,
    paths: [],
    cacheDir: cachePath,
    filter: ({ fileName }) => {
      if (!fileName) {
        return 0
      }
      fileName = fileName.toLowerCase()
      return (
        (!includes || includes.every(val => fileName.indexOf(val) >= 0)) &&
        (!excludes || excludes.every(val => fileName.indexOf(val) === -1))
      )
    },
    prefix
  })
}

const checkConnection = async (host, port, timeout = 2000) => {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      reject('timeout')
      socket.end()
    }, timeout)
    let socket = net.createConnection(port, host, () => {
      clearTimeout(timer)
      resolve(true)
      socket.end()
    })
    socket.on('error', err => {
      clearTimeout(timer)
      resolve(false)
    })
  })
}

module.exports = {
  checkConnection,
  getCachePath,
  getUserDataPath,
  getPluginCachePath,
  getBinaryUpdater
}

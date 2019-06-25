const fs = require('fs')
const path = require('path')
const createRenderer = require('./electron-shell')

// FIXME duplicated code: ethereum_clients/util
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

class Config {
  constructor(filePath) {
    this.filePath = filePath
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}))
    }
  }

  setConfig(newConfig) {
    if (newConfig === null) {
      return
    }
    if (newConfig.constructor.name !== 'Object') {
      console.log('config must be object literal')
      return
    }
    fs.writeFileSync(this.filePath, JSON.stringify(newConfig, null, 2))
  }

  setItem(key, value) {
    const config = this.getItem()
    config[key] = value
    this.setConfig(config)
  }

  getItem(key, default_val) {
    const config = JSON.parse(fs.readFileSync(this.filePath))
    if (!key) {
      return default_val || config
    }
    return config[key]
  }
}

const UserConfig = new Config(path.join(getUserDataPath(), 'config.json'))

const registerGlobalUserConfig = () => {
  global.UserConfig = UserConfig
}

const startConfigEditor = () => {
  const win = createRenderer(`file://${__dirname}/ui/json-editor.html`)
  win.setMenu(null)
}

module.exports = {
  startConfigEditor,
  registerGlobalUserConfig,
  getUserConfig: () => UserConfig
}

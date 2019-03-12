const fs = require('fs')
const path = require('path')
const { AppManager } = require('@philipplgh/electron-app-manager')
const { spawn } = require('child_process')
const { EventEmitter } = require('events')
const net = require('net')
const debug = require('debug')('geth-js')

// Init constants
let EXT_LENGTH = 0
let BINARY_NAME = ''
const STATES = {
  STARTING: 'STARTING' /* Node about to be started */,
  STARTED: 'STARTED' /* Node started */,
  CONNECTED: 'CONNECTED' /* IPC connected - all ready */,
  STOPPING: 'STOPPING' /* Node about to be stopped */,
  STOPPED: 'STOPPED' /* Node stopped */,
  ERROR: 'ERROR' /* Unexpected error */
}

// Set up cache
let GETH_CACHE
if (process.env.NODE_ENV === 'test') {
  GETH_CACHE = path.join(__dirname, '/../test', 'fixtures', 'geth_bin')
} else {
  GETH_CACHE = path.join(__dirname, 'geth_bin')
}

if (!fs.existsSync(GETH_CACHE)) {
  fs.mkdirSync(GETH_CACHE)
}

// Init variables
let urlFilter = ''
let dataDir = ''
let binaryPaths = []
let rpcId = 1

// Platform specific initialization
switch (process.platform) {
  case 'win32': {
    urlFilter = 'windows'
    EXT_LENGTH = '.zip'.length
    BINARY_NAME = 'geth.exe'
    dataDir = '%APPDATA%/Ethereum'
    break
  }
  case 'linux': {
    urlFilter = 'linux'
    EXT_LENGTH = '.tar.gz'.length
    BINARY_NAME = 'geth'
    dataDir = '~/.ethereum'
    break
  }
  case 'darwin': {
    urlFilter = 'darwin'
    EXT_LENGTH = '.tar.gz'.length
    BINARY_NAME = 'geth'
    dataDir = '~/Library/Ethereum'
    break
  }
  default: {
  }
}

const gethUpdater = new AppManager({
  repository: 'https://gethstore.blob.core.windows.net',
  modifiers: {
    version: ({ version }) =>
      version
        .split('-')
        .slice(0, -1)
        .join('-')
  },
  filter: ({ fileName }) =>
    !fileName.includes('alltools') &&
    (urlFilter && fileName.includes(urlFilter)),
  auto: false,
  paths: [],
  cacheDir: GETH_CACHE
})

const defaultConfig = {
  name: 'default',
  dataDir,
  host: 'localhost',
  port: 8546,
  network: 'main',
  syncMode: 'light',
  ipc: 'ipc'
}

class Geth extends EventEmitter {
  constructor() {
    super()
    this.state = STATES.STOPPED
    this.flags = []
    this.logs = []
    this.ipc = null
    this.responsePromises = {}
    this.config = defaultConfig
  }

  get isRunning() {
    return [STATES.STARTING, STATES.STARTED, STATES.CONNECTED].includes(
      this.state
    )
  }

  getUpdater() {
    return gethUpdater
  }

  getLogs() {
    return this.logs
  }

  async extractPackageBinaries(binaryPackage) {
    // On mac the tar contains as root entry a dir with the same name as the .tar.gz
    const basePackageName = binaryPackage.fileName.slice(0, -EXT_LENGTH)
    const binaryPathPackage = path.join(basePackageName, BINARY_NAME)
    const gethBinary = await gethUpdater.getEntry(
      binaryPackage,
      binaryPathPackage
    )
    const binaryPathDisk = path.join(GETH_CACHE, basePackageName)

    // The unlinking might fail if the binary is e.g. being used by another instance
    if (fs.existsSync(binaryPathDisk)) {
      fs.unlinkSync(binaryPathDisk)
    }

    // IMPORTANT: if the binary already exists the mode cannot be set
    fs.writeFileSync(binaryPathDisk, await gethBinary.getData(), {
      mode: parseInt('754', 8) // strict mode prohibits octal numbers in some cases
    })

    return binaryPathDisk
  }

  async getLocalBinary() {
    const latestCached = await gethUpdater.getLatestCached()
    if (latestCached) {
      // Binary in extracted form was found in e.g. standard location on the system
      if (latestCached.isBinary) {
        return latestCached.location
      } else {
        // Binary is packaged as .zip or.tar.gz
        return this.extractPackageBinaries(latestCached)
      }
    }
    return null
  }

  async getLocalBinaries() {
    return await gethUpdater.cache.getReleases()
  }

  async getReleases() {
    return await gethUpdater.getReleases()
  }

  async download(release, onProgress = () => {}) {
    if (!release) {
      release = await gethUpdater.getLatestRemote()
    }
    const _onProgress = (release, progress) => onProgress(progress)
    gethUpdater.on('update-progress', _onProgress)
    try {
      return await gethUpdater.download(release)
    } catch (error) {
      return error
    } finally {
      gethUpdater.removeListener('update-progress', _onProgress)
    }
  }

  getUpdaterMenu() {
    return createMenu(updater)
  }

  getGethFlags() {
    const { dataDir, network, host, port, syncMode, ipc } = this.config
    let flags = []

    if (dataDir) {
      flags.push('--datadir', dataDir)
    }

    if (syncMode) {
      const supportedSyncModes = ['fast', 'light', 'full']
      if (!supportedSyncModes.includes(syncMode)) {
        throw new Error('Geth: Unsupported Sync Mode')
      }
      flags.push('--syncmode', syncMode)
    }

    if (network) {
      switch (network) {
        case 'main':
          flags.push('--networkid', 1)
          break
        case 'ropsten':
          flags.push('--testnet')
          break
        case 'rinkeby':
          flags.push('--rinkeby')
          break
        default:
          throw new Error('Geth: Unsupported Network')
      }
    }

    if (ipc) {
      switch (ipc.toLowerCase()) {
        case 'websockets':
          flags.push('--ws', '--wsaddr', host, '--wsport', port)
          // ToDo: set --wsorigins for security
          break
        case 'http':
          throw new Error('Geth: HTTP is deprecated')
          break
        default:
          break
      }
    }

    return flags
  }

  start(binPackagePath) {
    return new Promise(async (resolve, reject) => {
      if (binPackagePath) {
        this.binPath = await this.extractPackageBinaries(binPackagePath)
      } else {
        this.binPath = await this.getLocalBinary()
      }
      if (!this.binPath) {
        throw new Error('No geth bin path')
      }

      // Set flags
      let flags
      try {
        flags = this.getGethFlags()
      } catch (error) {
        reject(error)
        return
      }

      this.state = STATES.STARTING
      this.emit('starting')
      debug('Emit: starting')
      debug('Start Geth: ', this.binPath)

      // Spawn process
      const proc = spawn(this.binPath, flags)
      const { stdout, stderr } = proc

      proc.on('error', error => {
        this.state = STATES.ERROR
        this.emit('error', error)
        debug('Emit: error', error)
        reject(error)
      })

      proc.on('close', code => {
        if (code === 0) {
          this.state = STATES.STOPPED
          this.emit('stopped')
          debug('Emit: stopped')
          return
        }
        // Closing with any code other than 0 means there was an error
        const errorMessage = `Geth child process exited with code: ${code}`
        this.emit('error', errorMessage)
        debug('Error: ', errorMessage)
        debug('DEBUG Last 10 log lines: ', this.getLogs().slice(-10))
        reject(errorMessage)
      })

      const onConnectResolvePromise = () => {
        const status = this.getStatus()
        resolve(status)
      }

      const onStart = () => {
        this.state = STATES.STARTED
        this.emit('started')
        debug('Emit: started')
        // Check for and connect IPC in 1s
        setTimeout(() => {
          this.connectIpc(onConnectResolvePromise)
        }, 1000)
      }

      const onData = data => {
        const log = data.toString()
        this.logs.push(log)
      }

      stderr.once('data', onStart.bind(this))
      stdout.on('data', onData.bind(this))
      stderr.on('data', onData.bind(this))
      this.proc = proc
    })
  }

  connectIpc(onConnect) {
    if (!this.isRunning) {
      return null
    }

    if (!this.ipcPath) {
      this.ipcPath = this.findIpcPathInLogs()
      if (!this.ipcPath) {
        // Recheck in 3s
        setTimeout(() => {
          debug('IPC endpoint not found, rechecking in 3s...')
          this.connectIpc(onConnect)
        }, 3000)
        return
      }
    }

    this.ipc = net.connect({ path: this.ipcPath })

    const onIpcConnect = () => {
      this.state = STATES.CONNECTED
      this.emit('connect')
      debug('Emit: connect')
      onConnect()
      debug('IPC Connected')
    }

    const onIpcEnd = () => {
      this.state = STATES.STOPPED
      this.ipc = null
      debug('IPC Connection Ended')
    }

    const onIpcError = error => {
      this.state = STATES.ERROR
      this.ipc = null
      debug('IPC Connection Error: ', error)
    }

    const onIpcTimeout = () => {
      this.state = STATES.ERROR
      this.ipc = null
      const errorMessage = 'IPC Connection Timeout'
      this.emit('error', errorMessage)
      debug(errorMessage)
    }

    this.ipc.on('connect', onIpcConnect.bind(this))
    this.ipc.on('end', onIpcEnd.bind(this))
    this.ipc.on('error', onIpcError.bind(this))
    this.ipc.on('timeout', onIpcTimeout.bind(this))
    this.ipc.on('data', this.onIpcData.bind(this))
  }

  findIpcPathInLogs() {
    let ipcPath
    const logs = this.getLogs()
    for (const thisLog of logs) {
      const found = thisLog.includes('IPC endpoint opened')
      if (found) {
        ipcPath = thisLog.split('=')[1].trim()
        debug('Found IPC path: ', ipcPath)
        return ipcPath
      }
    }
    return null
  }

  onIpcData(data) {
    if (!data) {
      return
    }

    debug('IPC data: ', data.toString())
    let message
    try {
      message = JSON.parse(data.toString())
    } catch (error) {
      debug('Error parsing JSON: ', error)
    }

    // Return if not a jsonrpc response
    if (!message || !message.jsonrpc) {
      return
    }

    const { id, method, result } = message

    if (typeof id !== 'undefined') {
      const promise = this.responsePromises[id]
      if (promise) {
        // Handle pending promise
        if (data.type === 'error') {
          promise.reject(message)
        } else if (message.error) {
          promise.reject(message.error)
        } else {
          promise.resolve(result)
        }
        delete this.responsePromises[id]
      }
    } else {
      if (method && method.includes('_subscription')) {
        // Emit subscription notification
        const { params } = message
        const { subscription: subscriptionId } = params
        this.emit(subscriptionId, params)
      }
    }
  }

  send(payload) {
    if (this.state !== STATES.CONNECTED) {
      throw Error('IPC Not Connected')
    }

    return new Promise((resolve, reject) => {
      const jsonString = JSON.stringify(payload)
      this.ipc.write(jsonString)
      // Add response promise
      this.responsePromises[payload.id] = { resolve, reject }
    })
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.proc || !this.isRunning) {
        resolve(true)
      }
      this.state = STATES.STOPPING
      this.proc.on('exit', () => {
        this.state = STATES.STOPPED
        resolve(true)
      })
      this.proc.on('error', error => {
        this.state = STATES.ERROR
        reject(new Error('Geth Error Stopping: ', error))
      })
      this.proc.kill('SIGINT')
      this.ipcPath = null
    })
  }

  async restart() {
    await this.stop()
    return this.start()
  }

  async checkForUpdates() {
    let result = await updater.checkForUpdates()
    return result
  }

  setConfig(newConfig) {
    this.config = newConfig
  }

  getConfig() {
    return this.config
  }

  getStatus() {
    return {
      client: 'geth',
      binPath: this.binPath,
      version: '1.8.20-stable',
      commit: '24d727b6d6e2c0cde222fa12155c4a6db5caaf2e',
      architecture: 'amd64',
      go: 'go1.11.2',
      isRunning: this.isRunning
    }
  }

  async rpc(method, params = []) {
    const payload = {
      jsonrpc: '2.0',
      id: rpcId++,
      method,
      params
    }
    try {
      const result = await this.send(payload)
      return result
    } catch (error) {
      return error
    }
  }

  async network() {
    let response = await this.rpc('net_version')
    return response
  }
}

module.exports = Geth

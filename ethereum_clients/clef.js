const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { EventEmitter } = require('events')
const { AppManager } = require('@philipplgh/electron-app-manager')
const debug = require('debug')('clef-js')

// TODO consider moving this into a
// helper / utils module to retrieve global settings
const USER_DATA_PATH =
  'electron' in process.versions
    ? require('electron').app.getPath('userData')
    : path.join(process.env.APPDATA, 'grid')
if (!fs.existsSync(USER_DATA_PATH)) {
  fs.mkdirSync(USER_DATA_PATH)
}

let CLEF_CACHE
if (process.env.NODE_ENV === 'test') {
  CLEF_CACHE = path.join(__dirname, '/../test', 'fixtures', 'clef_bin')
} else {
  CLEF_CACHE = path.join(USER_DATA_PATH, 'clef_bin')
}

if (!fs.existsSync(CLEF_CACHE)) {
  fs.mkdirSync(CLEF_CACHE)
}

let URL_FILTER = ''
let EXT_LENGTH = 0
let BINARY_NAME = ''
switch (process.platform) {
  case 'win32': {
    URL_FILTER = 'windows'
    EXT_LENGTH = '.zip'.length
    BINARY_NAME = 'clef.exe'
    break
  }
  case 'linux': {
    URL_FILTER = 'linux'
    EXT_LENGTH = '.tar.gz'.length
    BINARY_NAME = 'clef'
    break
  }
  case 'darwin': {
    URL_FILTER = 'darwin'
    EXT_LENGTH = '.tar.gz'.length
    BINARY_NAME = 'clef'
    break
  }
  default: {
  }
}

const clefHandlers = {
  ui_approveTx: {
    msg: () => 'Transaction Signing is awaiting review.',
    ui: true
  },
  ui_approveSignData: {
    msg: () => 'Message signing is awaiting review.',
    ui: true
  },
  ui_approveListing: {
    msg: () => 'Account listing is awaiting review.',
    ui: true
  },
  ui_approveNewAccount: {
    msg: () => 'New account request is awaiting review.',
    ui: true
  },
  // These ones do not have a separate UI
  ui_showInfo: { msg: data => data.params[0].text },
  ui_showError: { msg: data => data.params[0].text },
  ui_onApprovedTx: { msg: data => 'Signed ' + data.params[0].tx.hash },
  ui_onSignerStartup: {
    msg: data =>
      'Clef is up. Web: ' +
      data.params[0].info.extapi_http +
      ' IPC:' +
      data.params[0].info.extapi_ipc
  },
  ui_onInputRequired: {
    msg: data => 'Input required:' + data.params[0].text
  }
}

const clefUpdater = new AppManager({
  repository: 'https://gethstore.blob.core.windows.net',
  modifiers: {
    version: ({ version }) =>
      version
        .split('-')
        .slice(0, -1)
        .join('-')
  },
  filter: ({ fileName }) =>
    fileName.includes('alltools') &&
    (URL_FILTER && fileName.includes(URL_FILTER)),
  auto: false,
  paths: [],
  cacheDir: CLEF_CACHE
})

class Clef extends EventEmitter {
  constructor() {
    super()
    this.logs = []
    this.running = false
  }

  async getLatestRelease() {
    let release
    // First, download or find the latest local binaries
    const cached = await clefUpdater.getLatestCached()
    if (cached) {
      release = cached
    } else {
      debug('No cached releases found. Fetching latest releases...')
      const targetRelease = await clefUpdater.getLatest('>=1.9.0')
      debug('Downloading latest release: ', targetRelease.fileName)
      release = await this.download(targetRelease)
    }
    return release
  }

  async download(release) {
    const onProgress = (release, progress) => {
      this.emit('downloadProgress', progress)
      if (progress === 0 || progress % 5 === 0) {
        debug(`Download progress: ${progress}%`)
      }
    }
    clefUpdater.on('update-progress', onProgress)
    try {
      return await clefUpdater.download(release)
    } catch (error) {
      return error
    } finally {
      clefUpdater.removeListener('update-progress', onProgress)
    }
  }

  async extractPackageBinaries(release) {
    // get the package name - we need it to build the path to the clef binary
    const basePackageName = release.fileName.slice(0, -EXT_LENGTH)

    // retrieve the AppPackage object for the downloaded or cached IRelease
    const pkg = await clefUpdater.getLocalPackage(release)

    // for debugging
    // let entries = await pkg.getEntries()
    // console.log('pkg entries', entries)

    // build relative path in pkg e.g. : 'geth-alltools-windows-amd64-1.9.0-unstable-f82185a4/clef.exe'
    const binaryPathInPackage = basePackageName + '/' + BINARY_NAME

    // load binary from package
    const binaryEntry = await pkg.getEntry(binaryPathInPackage)
    const { file } = binaryEntry

    // extract binary from package and write to cache
    const binaryPathDisk = path.join(CLEF_CACHE, basePackageName)
    fs.writeFileSync(binaryPathDisk, await file.readContent(), {
      mode: parseInt('754', 8) // strict mode prohibits octal numbers in some cases
    })

    return binaryPathDisk
  }

  handleData(data) {
    if (data.includes('error') || data.includes('fatal')) {
      // this.emit('error', data)
    }

    if (data.type !== 'request') {
      debug('Non-request rpc: ' + rpc)
      return
    }

    let payload = data.payload
    let handler = clefHandlers[payload.method]

    if (handler) {
      // notify(mainWindow, handler.msg(payload));
      if (handler.ui) {
        this.emit('approvalRequired', payload)
      } else {
        // ui_ShowInfo, ui_ShowError, ui_OnSignerStartup, ui_OnApprovedTx, ui_onUserInputReqiored
        // TODO, display this 'immediately'
        // In the case of user input required, we need to send a response,
        // but for notifications, there's no need
        if (payload.id) {
          const message = { jsonrpc: '2.0', id: payload.id, result: true }
          this.send(message)
        }
      }
    } else {
      throw new Error('Missing handler for method: ', payload.method)
    }
  }

  async start() {
    this.emit('starting')
    this.running = true
    const release = await this.getLatestRelease()
    this.release = release
    const binaryPathDisk = await this.extractPackageBinaries(release)

    debug('Start clef binary: ', binaryPathDisk)

    // Flags
    let flags = [
      '--rpc',
      '--ipcdisable',
      '--stdio-ui',
      '--stdio-ui-test',
      '--advanced'
    ]
    flags.push('--4bytedb', path.join(CLEF_CACHE, '4byte.json'))

    const proc = spawn(binaryPathDisk, flags)
    const { stdout, stderr, stdin } = proc

    proc.on('error', error => {
      this.emit('error', error)
      debug('Emit: error', error)
      reject(error)
    })

    proc.on('close', code => {
      if (code === 0) {
        this.running = false
        this.emit('stopped')
        debug('Emit: stopped')
        return
      }
      // Closing with any code other than 0 means there was an error
      const errorMessage = `Clef child process exited with code: ${code}`
      // this.emit('error', errorMessage)
      debug('Error: ', errorMessage)
      debug('DEBUG Last 10 log lines: ', this.logs.slice(-10))
      // reject(errorMessage)
      this.running = true
    })

    const onData = data => {
      const log = data.toString()
      this.logs.push(log)
      this.emit('log', log)
      debug('Data: ', log)
      this.handleData(log)
    }

    const onStart = () => {
      this.emit('started')
      debug('Emit: started')
    }

    stdout.on('data', onData.bind(this))
    stdout.once('data', onStart.bind(this))
    stderr.on('data', onData.bind(this))

    this.proc = proc

    // setTimeout(() => {
    //   // clef expects an 'ok' for early version
    //   stdin.write('ok\n')
    //   stdin.end()
    // }, 3000)
  }

  async stop() {}

  async send(data) {
    if (!this.proc) {
      return new Error('Clef not running')
    }
    const message = JSON.stringify(data)
    this.proc.stdin.write(message)
    this.proc.stdin.write('\n')
    debug('Message sent: ', data)
  }
}

module.exports = Clef

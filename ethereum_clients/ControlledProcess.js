const { Notification } = require('electron')
const path = require('path')
const debug = require('debug')
const { EventEmitter } = require('events')
const { spawn } = require('child_process')
const net = require('net')

const STATES = {
  STARTING: 'STARTING' /* Node about to be started */,
  STARTED: 'STARTED' /* Node started */,
  CONNECTED: 'CONNECTED' /* IPC connected - all ready */,
  DISCONNECTED: 'DISCONNECTED' /* IPC disconnected */,
  STOPPING: 'STOPPING' /* Node about to be stopped */,
  STOPPED: 'STOPPED' /* Node stopped */,
  ERROR: 'ERROR' /* Unexpected error */
}

// TODO add file to electron packaged files
class ControlledProcess extends EventEmitter {
  constructor(binaryPath, resolveIpc, handleData) {
    super()
    this.binaryPath = binaryPath
    this.resolveIpc = resolveIpc
    this.handleData = handleData
    this.debug = console.log // debug(name)
    this.ipc = undefined
    this.stdin = undefined
    this.logs = []
    this._state = STATES.STOPPED
    this.responsePromises = []
  }
  get state() {
    return this._state
  }
  set state(newState) {
    this._state = newState
  }
  get isRunning() {
    return [STATES.STARTING, STATES.STARTED, STATES.CONNECTED].includes(
      this.state
    )
  }
  createStateListeners() {
    // Listen to state events that may emit from plugin code
    this.on('newState', newState => {
      this.state = STATES[newState.toUpperCase()]
    })
  }
  removeStateListeners() {
    this.removeAllListeners('newState')
  }
  start(flags) {
    return new Promise((resolve, reject) => {
      this.createStateListeners()
      this.state = STATES.STARTING
      this.emit('newState', 'starting')
      this.debug('Start: ', this.binaryPath)
      this.debug('Flags: ', flags)
      let hasFiredOnStart = false

      flags = flags || []

      // Add start cmd to logs
      const cmd = `${this.binaryPath} ${flags.join(' ')}`
      this.logs.push(cmd)

      // Spawn process
      const proc = spawn(this.binaryPath, flags)
      const { stdout, stderr, stdin } = proc
      this.proc = proc
      this.stdin = stdin

      const onProcError = error => {
        this.state = STATES.ERROR
        this.emit('pluginError', error)
        reject(error)
      }

      const onProcClose = code => {
        if (this.state !== STATES.STOPPED) {
          this.state = STATES.STOPPED
          this.emit('newState', 'stopped')
        }

        if (code !== 0) {
          // Closing with any code other than 0 means there was an error
          const errorMessage = `${this.name} child process exited with code: ${code}`
          this.emit('pluginError', errorMessage)
          this.debug('Error: ', errorMessage)
          this.debug('DEBUG Last 10 log lines: ', this.logs.slice(-10))
          reject(errorMessage)
        }
      }

      const onStart = () => {
        if (hasFiredOnStart) {
          return
        }
        hasFiredOnStart = true
        this.state = STATES.STARTED
        this.emit('newState', 'started')
        // Check for and connect IPC in 1s
        setTimeout(async () => {
          try {
            if (this.resolveIpc) {
              /* FIXME
              // Recheck in 3s
              setTimeout(() => {
                debug('IPC endpoint not found, rechecking in 3s...')
                this.connectIpc(onConnect)
              }, 3000)
              */
              this.ipcPath = this.resolveIpc(this.logs)
            }
            if (this.ipcPath) {
              console.log('Connecting to IPC at', this.ipcPath)
              const state = await this.connectIPC(this.ipcPath)
              console.log('Connected? state: ', state)
              if (state === STATES.CONNECTED) {
                resolve(this)
              }
            } else {
              // throw new Error('Could not resolve IPC path.')
              // FIXED: ipfs app won't start if ipfs is started as daemon which will work even without ipc
              this.debug(
                `Failed to establish ipc connection: 'Could not resolve IPC path.'`
              )
              resolve(this)
            }
          } catch (error) {
            this.debug(`Failed to establish ipc connection: ${error.message}`)
          }
        }, 3000) // FIXME require long timeouts in tests - better solution?
      }

      const onData = data => {
        const log = data.toString()
        if (log) {
          let parts = log.split(/\r|\n/)
          parts = parts.filter(p => !['', '> '].includes(p))
          this.logs.push(...parts)
          parts.map(logPart => {
            this.emit('log', logPart)
            if (this.handleData) {
              this.handleData(logPart, this.emit.bind(this), Notification)
            }
            if (/^error\W/.test(logPart.toLowerCase())) {
              this.emit('pluginError', logPart)
            }
          })
        }
      }

      proc.on('error', onProcError.bind(this))
      proc.on('close', onProcClose.bind(this))
      stdout.once('data', onStart.bind(this))
      stderr.once('data', onStart.bind(this))
      stdout.on('data', onData.bind(this))
      stderr.on('data', onData.bind(this))
    })
  }
  stop() {
    return new Promise((resolve, reject) => {
      // FIXME kill IPC ? or is it indirectly closed: onIpcEnd
      if (!this.proc || !this.isRunning) {
        resolve(this)
      }
      if (this.state !== STATES.STOPPED) {
        this.state = STATES.STOPPING
        this.emit('newState', 'stopping')
      }
      const onProcExit = () => {
        if (this.state !== STATES.STOPPED) {
          this.state = STATES.STOPPED
          this.emit('newState', 'stopped')
        }
        resolve(this)
      }
      const onProcError = () => {
        this.state = STATES.ERROR
        this.emit('pluginError', error)
        reject(new Error('Error Stopping: ', error))
      }
      this.proc.on('exit', onProcExit.bind(this))
      this.proc.on('error', onProcError.bind(this))
      this.proc.kill('SIGINT')
      // this.ipcPath = null
    })
  }
  // tries to establish and IPC connection to the spawned process
  connectIPC(ipcPath) {
    return new Promise((resolve, reject) => {
      if (this.ipc) {
        return reject(new Error('Close existing IPC before reopen.'))
      }
      this.ipc = net.connect({ path: ipcPath })

      const onIpcConnect = () => {
        this.state = STATES.CONNECTED
        this.emit('newState', 'connected')
        resolve(this.state)
        this.debug('IPC Connected.')
      }

      const onIpcEnd = () => {
        if (![STATES.STOPPING, STATES.STOPPED].includes(this.state)) {
          this.state = STATES.DISCONNECTED
          this.emit('newState', 'disconnected')
        }
        this.ipc = null
        this.debug('IPC Connection Ended')
      }

      const onIpcError = error => {
        this.state = STATES.ERROR
        this.ipc = null
        this.emit('pluginError', error)
        this.debug('IPC Connection Error: ', error)
      }

      const onIpcTimeout = () => {
        this.state = STATES.ERROR
        this.ipc = null
        const errorMessage = 'IPC Connection Timeout'
        this.emit('pluginError', errorMessage)
        this.debug(errorMessage)
        reject(new Error('IPC connection timed out'))
      }

      this.ipc.on('connect', onIpcConnect.bind(this))
      this.ipc.on('end', onIpcEnd.bind(this))
      this.ipc.on('error', onIpcError.bind(this))
      this.ipc.on('timeout', onIpcTimeout.bind(this))
      this.ipc.on('data', this.onIpcData.bind(this))
    })
  }
  onIpcData(data) {
    if (!data) return
    if (this.incompleteData) {
      data = this.partialData.concat(data.toString())
    }

    let message
    try {
      message = JSON.parse(data.toString())
      if (this.partialData) {
        this.partialData = null
      }
    } catch (error) {
      // this.debug('Error parsing JSON: ', error)
      // TODO: handle multiple clients
      this.partialData = data.toString()
      return
    }

    // TODO loglevel=verbose
    // this.debug('IPC data: ', data.toString())

    // Return if not a jsonrpc response
    if (!message || !message.jsonrpc) return

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
      // All other messages grouped into 'notification' category
      // It is the responsibility of the UI to filter for ID
      const { params } = message
      this.emit('notification', params)
    }
  }
  write(payload) {
    if (!this.proc) {
      return
    }
    const { stdin } = this.proc
    stdin.write(payload + '\n')
    debug('Wrote to stdin: ', payload)
  }
  // private low level ipc
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
  getLogs() {
    return this.logs
  }
  appendLogs(lines) {
    this.logs = this.logs.concat(lines)
  }
  async restart() {
    await this.stop()
    return this.start()
  }
}

module.exports = ControlledProcess

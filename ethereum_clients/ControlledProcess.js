const path = require('path')
const debug = require('debug')
const { EventEmitter } = require('events')
const { spawn } = require('child_process')
const net = require('net')

const STATES = {
  STARTING: 'STARTING' /* Node about to be started */,
  STARTED: 'STARTED' /* Node started */,
  CONNECTED: 'CONNECTED' /* IPC connected - all ready */,
  STOPPING: 'STOPPING' /* Node about to be stopped */,
  STOPPED: 'STOPPED' /* Node stopped */,
  ERROR: 'ERROR' /* Unexpected error */
}

// TODO add file to electron packaged files
class ControlledProcess extends EventEmitter {
  constructor(binaryPath, resolveIpc) {
    super()
    this.binaryPath = binaryPath
    this.resolveIpc = resolveIpc
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
  start(flags) {
    return new Promise((resolve, reject) => {
      this.state = STATES.STARTING
      this.emit('starting')
      this.debug('Emit: starting')
      this.debug('Start: ', this.binaryPath)
      this.debug('Flags: ', flags)

      flags = flags || []

      // Add start cmd to logs
      const cmd = `${this.binaryPath} ${flags.join(' ')}`
      this.logs.push(cmd)

      // Spawn process
      const proc = spawn(this.binaryPath, flags)
      const { stdout, stderr, stdin } = proc
      this.stdin = stdin

      proc.on('error', error => {
        this.state = STATES.ERROR
        this.emit('error', error)
        this.debug('Emit: error', error)
        reject(error)
      })

      proc.on('close', code => {
        if (code === 0) {
          this.state = STATES.STOPPED
          this.emit('stopped')
          this.debug('Emit: stopped')
          return
        }
        // Closing with any code other than 0 means there was an error
        const errorMessage = `${
          this.name
        } child process exited with code: ${code}`
        // this.emit('error', errorMessage)
        this.debug('Error: ', errorMessage)
        this.debug('DEBUG Last 10 log lines: ', this.logs.slice(-10))
        reject(errorMessage)
      })

      const onStart = () => {
        this.state = STATES.STARTED
        this.emit('started')
        this.debug('Emit: started')
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
              console.log('connect to ipc at', this.ipcPath)
              const state = await this.connectIPC(this.ipcPath)
              console.log('connected?', state)
              if (state === STATES.CONNECTED) {
                resolve(this)
              }
            } else {
              throw new Error('could not resolve ipc path')
            }
          } catch (error) {
            this.debug('failed to establish ipc connection: ' + error.message)
          }
        }, 10 * 1000) // FIXME require long timeouts in tests - better solution?
      }

      const onData = data => {
        const log = data.toString()
        if (log) {
          let parts = log.split(/\r|\n/)
          parts = parts.filter(p => p !== '')
          this.logs.push(...parts)
          parts.map(l => {
            this.emit('log', l)
            if (l.toLowerCase().includes('error')) {
              this.emit('error', l)
              this.debug('Emit: error', l)
            }
          })
        }
      }

      stderr.once('data', onStart.bind(this))
      stdout.on('data', onData.bind(this))
      stderr.on('data', onData.bind(this))
      this.proc = proc
    })
  }
  stop() {
    return new Promise((resolve, reject) => {
      // FIXME kill IPC ? or is it indirectly closed: onIpcEnd
      if (!this.proc || !this.isRunning) {
        resolve(this)
      }
      this.state = STATES.STOPPING
      this.proc.on('exit', () => {
        this.state = STATES.STOPPED
        resolve(this)
      })
      this.proc.on('error', error => {
        this.state = STATES.ERROR
        reject(new Error('Error Stopping: ', error))
      })
      this.proc.kill('SIGINT')
      // this.ipcPath = null
    })
  }
  // tries to establish and IPC connection to the spawned process
  connectIPC(ipcPath) {
    return new Promise((resolve, reject) => {
      if (this.ipc) {
        return reject(new Error('close existing IPC before reopen'))
      }
      this.ipc = net.connect({ path: ipcPath })

      const onIpcConnect = () => {
        this.state = STATES.CONNECTED
        this.emit('connected')
        this.debug('Emit: connected')
        resolve(this.state)
        this.debug('IPC Connected')
      }

      const onIpcEnd = () => {
        this.state = STATES.STOPPED
        this.ipc = null
        this.debug('IPC Connection Ended')
      }

      const onIpcError = error => {
        this.state = STATES.ERROR
        this.ipc = null
        this.debug('IPC Connection Error: ', error)
      }

      const onIpcTimeout = () => {
        this.state = STATES.ERROR
        this.ipc = null
        const errorMessage = 'IPC Connection Timeout'
        reject(new Error('IPC connection timed out'))
        this.emit('error', errorMessage)
        this.debug(errorMessage)
      }

      this.ipc.on('connect', onIpcConnect.bind(this))
      this.ipc.on('end', onIpcEnd.bind(this))
      this.ipc.on('error', onIpcError.bind(this))
      this.ipc.on('timeout', onIpcTimeout.bind(this))
      this.ipc.on('data', this.onIpcData.bind(this))
    })
  }
  onIpcData(data) {
    if (!data) {
      return
    }

    this.debug('IPC data: ', data.toString())
    let message
    try {
      message = JSON.parse(data.toString())
    } catch (error) {
      this.debug('Error parsing JSON: ', error)
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
      // FIXME hardcoded business logic
      if (method && method.includes('_subscription')) {
        // Emit subscription notification
        const { params } = message
        const { subscription: subscriptionId } = params
        this.emit(subscriptionId, params)
      }
    }
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

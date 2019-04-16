const path = require('path')
const debug = require('debug')
const { EventEmitter } = require('events')
const { spawn } = require('child_process')

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
  constructor(binaryPath, name) {
    super()
    this.binaryPath = binaryPath
    this.debug = console.log // debug(name)
    this.logs = []
    this._state = STATES.STOPPED
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

      flags = []

      // Spawn process
      const proc = spawn(this.binaryPath, flags)
      const { stdout, stderr } = proc

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
        setTimeout(() => {
          // FIXME this.connectIpc(onConnectResolvePromise)
        }, 1000)
      }

      const onData = data => {
        const logLines = data
          .toString()
          .trim('\n')
          .split('\n')
        this.appendLogs(logLines)
        this.emit('log', logLines)
      }

      stderr.once('data', onStart.bind(this))
      stdout.on('data', onData.bind(this))
      stderr.on('data', onData.bind(this))
      this.proc = proc

      resolve(this)
    })
  }
  stop() {
    return new Promise((resolve, reject) => {
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

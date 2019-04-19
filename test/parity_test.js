const { assert } = require('chai')
const fs = require('fs')
const path = require('path')
const { PluginHost } = require('../ethereum_clients/PluginHost')

describe('Clients', function() {
  describe('Parity', function() {
    it('establishes an IPC connection', async function() {
      this.timeout(2 * 60 * 1000)
      const pluginHost = new PluginHost()
      const parity = pluginHost.getPluginByName('parity')
      assert.isDefined(parity, 'parity plugin loaded and found')
      const releases = await parity.getReleases()
      let latest = releases[0]
      if (latest.remote) {
        latest = await parity.download(latest, progress => {
          console.log('progress', progress)
        })
      }
      // console.log('exists', latest.location, latest.remote)
      assert.isTrue(
        fs.existsSync(latest.location),
        'local parity package exists'
      )
      // will find or extract the binary from package
      const { binaryPath } = await parity.getLocalBinary()
      assert.isTrue(
        fs.existsSync(binaryPath),
        'parity executable was extracted'
      )

      // both works: with or without specified IPC path
      const config = {} // parity.config

      return new Promise((resolve, reject) => {
        parity.on('log', log => {
          console.log('log', log)
        })
        parity.on('started', () => {
          console.log('started...')
        })
        parity.on('connected', () => {
          console.log('connected!')
          parity.stop()
          resolve()
        })
        parity.start(latest, config)
      })
    })
  })
})

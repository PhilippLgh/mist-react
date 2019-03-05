const { assert } = require('chai')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const Geth = require('../ethereum_clients/geth')

const gethBin = path.join(__dirname, 'fixtures', 'geth_bin')
const dataDir = path.join(__dirname, 'fixtures', 'data_dir')

const mockedReleases = {
  darwin: [
    {
      name: 'geth-darwin-amd64-1.8.21-9dc5d1a9',
      fileName: 'geth-darwin-amd64-1.8.21-9dc5d1a9.tar.gz',
      version: '1.8.21',
      tag: '1.8.21-9dc5d1a9',
      commit: undefined,
      size: '9976551',
      channel: undefined,
      location: path.join(gethBin, 'geth-darwin-amd64-1.8.21-9dc5d1a9.tar.gz'),
      error: undefined,
      checksums: { md5: '81544a325e179459454fb58aa73df54b' },
      signature:
        'https://gethstore.blob.core.windows.net/builds/geth-darwin-amd64-1.8.21-9dc5d1a9.tar.gz.asc'
    }
  ],
  linux: [
    {
      name: 'geth-linux-amd64-1.8.21-9dc5d1a9',
      fileName: 'geth-linux-amd64-1.8.21-9dc5d1a9.tar.gz',
      version: '1.8.21',
      tag: '1.8.21-9dc5d1a9',
      commit: undefined,
      size: '14671229',
      channel: undefined,
      location: path.join(gethBin, 'geth-linux-amd64-1.8.21-9dc5d1a9.tar.gz'),
      error: undefined,
      checksums: { md5: '516fc2665d18e7b117333d2ea4959f9c' },
      signature:
        'https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.8.21-9dc5d1a9.tar.gz.asc'
    }
  ],
  windows: [
    {
      name: 'geth-windows-amd64-1.8.21-9dc5d1a9',
      fileName: 'geth-windows-amd64-1.8.21-9dc5d1a9.exe',
      version: '1.8.21',
      tag: '1.8.21-9dc5d1a9',
      commit: undefined,
      size: '45131093',
      channel: undefined,
      location: path.join(gethBin, 'geth-windows-amd64-1.8.21-9dc5d1a9.exe'),
      error: undefined,
      checksums: { md5: 'a5cd4ba8f119168bbdc9cd087d3c89f2' },
      signature:
        'https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-1.8.21-9dc5d1a9.exe.asc'
    }
  ]
}

// Platform specific initialization
let release
switch (process.platform) {
  case 'win32': {
    release = mockedReleases.windows[0]
    // dataDir = '%APPDATA%/Ethereum'
    break
  }
  case 'linux': {
    release = mockedReleases.linux[0]
    // dataDir = '~/.ethereum'
    break
  }
  case 'darwin': {
    release = mockedReleases.darwin[0]
    // dataDir = '~/Library/Ethereum'
    break
  }
  default: {
  }
}

describe('Clients', function() {
  describe('Geth.js', function() {
    let geth

    beforeEach(function() {
      geth = new Geth()
      const defaultConfig = geth.getConfig()
      geth.setConfig({ ...defaultConfig, dataDir })
    })

    afterEach(async function() {
      if (geth.isRunning) {
        await geth.stop()
      }
      // clear dataDir
      rimraf.sync(dataDir)
    })

    after(function() {
      // delete executables
      const isExecutable = fileName => {
        // determine is executable if no file extension
        // (last part of filename is 8 character release hash)
        const parts = fileName.split('-')
        return parts[parts.length - 1].length == 8
      }
      fs.readdir(gethBin, (error, files) => {
        files.forEach(fileName => {
          if (isExecutable(fileName)) {
            // delete file
            const filePath = path.join(gethBin, fileName)
            fs.unlinkSync(filePath)
          }
        })
      })
    })

    describe('extractPackageBinaries()', function() {
      it('returns the correct binary path disk', async function() {
        const binaryPathDisk = await geth.extractPackageBinaries(release)
        assert.include(binaryPathDisk, release.name)
      })
    })

    describe('getLocalBinaries()', function() {
      it('finds all local geth binaries', async function() {
        const releases = await geth.getLocalBinaries()
        assert.typeOf(releases, 'array')
        assert.isAbove(releases.length, 0)
        assert.include(releases[0].fileName, release.fileName)
      })
    })

    describe('getLocalBinary()', function() {
      it('returns latest cached local binary', async function() {
        const binaryPath = await geth.getLocalBinary()
        assert.include(binaryPath, release.name)
      })
    })

    describe('start()', function() {
      it('starts geth', async function() {
        this.timeout(10 * 1000)
        const result = await geth.start()
        assert.equal(result.client, 'geth')
        assert.equal(geth.getConfig().dataDir, dataDir)
        assert.equal(geth.isRunning, true)
      })

      it('starts geth in ropsten', async function() {
        this.timeout(10 * 1000)
        const config = geth.getConfig()
        geth.setConfig({ ...config, network: 'ropsten' })
        await geth.start()
        const result = await geth.rpc('net_version')
        assert.equal(result, 3)
      })

      it('starts geth in rinkeby', async function() {
        this.timeout(10 * 1000)
        const config = geth.getConfig()
        geth.setConfig({ ...config, network: 'rinkeby' })
        await geth.start()
        const result = await geth.rpc('net_version')
        assert.equal(result, 4)
      })

      it('starts geth in fast sync', async function() {
        this.timeout(10 * 1000)
        const config = geth.getConfig()
        geth.setConfig({ ...config, syncMode: 'fast' })
        await geth.start()
        assert.include(geth.getConfig().syncMode, 'fast')
      })

      it('starts geth in full sync', async function() {
        this.timeout(10 * 1000)
        const config = geth.getConfig()
        geth.setConfig({ ...config, syncMode: 'full' })
        await geth.start()
        assert.include(geth.getConfig().syncMode, 'full')
      })

      it('starts geth with websockets', async function() {
        this.timeout(10 * 1000)
        const config = geth.getConfig()
        geth.setConfig({ ...config, ipc: 'websockets' })
        await geth.start()
        assert.include(geth.getLogs().join(' '), 'WebSocket endpoint opened')
      })

      it('does not allow geth to start http rpc because it is deprecated', async function() {
        this.timeout(10 * 1000)
        const config = geth.getConfig()
        geth.setConfig({ ...config, ipc: 'http' })
        geth
          .start()
          .then(() => {
            assert.equal(geth.isRunning, false)
          })
          .catch(error => {
            assert.include(error.toString(), 'Geth: HTTP is deprecated')
          })
      })
    })

    describe('stop()', function() {
      it('stops geth', async function() {
        this.timeout(10 * 1000)
        await geth.start()
        const result = await geth.stop(geth)
        assert.equal(result, true)
        assert.equal(geth.isRunning, false)
      })
    })

    describe('restart()', function() {
      it('restarts geth', async function() {
        this.timeout(10 * 1000)
        await geth.start()
        const result = await geth.restart()
        assert.equal(result.client, 'geth')
        assert.equal(geth.isRunning, true)
      })
    })

    describe('rpc()', function() {
      it('returns an rpc response', async function() {
        await geth.start()
        const result = await geth.rpc('net_version')
        assert.equal(result, 1)
      })

      // TODO: This is taking >60s and timing out, any faster way?
      // it('returns a subscription response', async function(done) {
      //   this.timeout(60 * 1000)
      //   await geth.start()
      //   const subscriptionId = await geth.rpc('eth_subscribe', ['syncing'])
      //   geth.on(subscriptionId, () => {
      //     assert.equal('1', result.subscription)
      //     done()
      //   })
      // })
    })

    describe('getStatus()', function() {
      it('returns the status', async function() {
        const status = geth.getStatus()
        assert.equal(status.client, 'geth')
      })
    })

    describe('getConfig', function() {
      it('returns the config', async function() {
        const config = geth.getConfig()
        assert.equal(config.network, 'main')
      })
    })

    describe('setConfig', function() {
      it('sets a new config', async function() {
        const config = geth.getConfig()
        const newConfig = { ...config, network: 'rinkeby' }
        await geth.setConfig(newConfig)
        assert.equal(geth.getConfig(), newConfig)
      })
    })

    describe('getReleases()', function() {
      it('finds hosted geth releases', async function() {
        this.timeout(60 * 1000)
        const releases = await geth.getReleases()
        assert.typeOf(releases, 'array')
        assert.include(releases[0].fileName, 'geth')
      })
    })
  })
})

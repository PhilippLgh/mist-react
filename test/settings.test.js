const { assert } = require('chai')
const { generateFlags } = require('../ethereum_clients/util')

describe('generateFlags', function() {
  it('should handle an empty settings', function() {
    const input = {}
    const settings = []
    const flags = generateFlags(input, settings)

    assert.isArray(flags)
    assert.deepEqual(flags, [])
  })

  it('should parse basic field', function() {
    const input = { network: '' }
    const settings = [{ id: 'network', flag: '--rinkeby' }]
    const flags = generateFlags(input, settings)

    assert.deepEqual(flags, ['--rinkeby'])
  })

  it('should parse some basic fields', function() {
    const input = {
      network: '',
      debug: '',
      nodiscovery: ''
    }
    const settings = [
      { id: 'network', flag: '--rinkeby' },
      { id: 'debug', flag: '--debug' },
      { id: 'nodiscovery', flag: '--no-discovery' }
    ]
    const flags = generateFlags(input, settings)

    assert.include(flags, '--rinkeby')
    assert.include(flags, '--debug')
    assert.include(flags, '--no-discovery')
  })

  it('should parse text values', function() {
    const input = {
      cache: '1024',
      syncmode: 'light'
    }
    const settings = [
      { id: 'cache', flag: '--cache %s' },
      { id: 'syncmode', flag: '--syncmode %s' }
    ]
    const flags = generateFlags(input, settings)

    assert.deepEqual(flags, ['--cache', '1024', '--syncmode', 'light'])
  })

  it('should parse simple options', function() {
    const input = {
      syncmode: 'light'
    }
    const settings = [
      {
        id: 'syncmode',
        options: ['fast', 'full', 'light'],
        flag: '--syncmode %s'
      }
    ]

    const flags = generateFlags(input, settings)
    assert.deepEqual(flags, ['--syncmode', 'light'])
  })

  it('should parse full options', function() {
    const input = {
      network: 'rinkeby'
    }
    const settings = [
      {
        id: 'network',
        default: 'main',
        options: [
          { value: 'ropsten', flag: '--testnet' },
          { value: 'rinkeby', flag: '--rinkeby' }
        ]
      }
    ]

    const flags = generateFlags(input, settings)
    assert.deepEqual(flags, ['--rinkeby'])
  })

  it('full options should allow empty flags', function() {
    const input = {
      network: 'mainnet'
    }
    const settings = [
      {
        id: 'network',
        options: [
          { value: 'ropsten', flag: '--testnet' },
          { value: 'mainnet', flag: '' }
        ]
      }
    ]

    const flags = generateFlags(input, settings)
    assert.deepEqual(flags, [])
  })

  it('should parse value with full options', function() {
    const input = {
      syncmode: 'light'
    }
    const settings = [
      {
        id: 'syncmode',
        options: [
          { value: 'fast', flag: '--syncmode %s' },
          { value: 'light', flag: '--syncmode %s --maxpeers=100' }
        ]
      }
    ]

    const flags = generateFlags(input, settings)
    assert.deepEqual(flags, ['--syncmode', 'light', '--maxpeers=100'])
  })
})

describe('generateFlags error handling', function() {
  it('should throw if settings is not an array', function() {
    const input = {}
    const settings = {
      cache: { flag: '--cache %s' },
      syncmode: { flag: '--syncmode %s' }
    }

    assert.throws(function() {
      generateFlags(input, settings)
    }, 'Settings must be an Array instance')
  })

  it('should throw for basic field without flag', function() {
    const input = { network: 'main' }
    const settings = [{ id: 'network' }]

    assert.throws(function() {
      generateFlags(input, settings)
    }, 'Config entry "network" must have the "flag" key')
  })

  it('should throw for simple options without flag', function() {
    const input = { sync: 'fast' }
    const settings = [
      {
        id: 'sync',
        options: ['light', 'fast', 'full']
      }
    ]

    assert.throws(function() {
      generateFlags(input, settings)
    }, 'Option "fast" must have the "flag" key')
  })

  it('should throw for full options without flag', function() {
    const input = { network: 'main' }
    const settings = [
      {
        id: 'network',
        options: [{ value: 'main', label: 'Main' }]
      }
    ]

    assert.throws(function() {
      generateFlags(input, settings)
    }, 'Option "main" must have the "flag" key')
  })
})

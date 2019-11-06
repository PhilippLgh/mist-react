let platform = 'windows'
let dataDir = `${process.env.APPDATA}/Ethereum`
let keystoreDir = `${dataDir}/keystore`

// Platform specific initialization
switch (process.platform) {
  case 'win32': {
    platform = 'windows'
    dataDir = `${process.env.APPDATA}\\Ethereum`
    keystoreDir = `${dataDir}\\keystore`
    break
  }
  case 'linux': {
    platform = 'linux'
    dataDir = '~/.ethereum'
    break
  }
  case 'darwin': {
    platform = 'darwin'
    dataDir = '~/Library/Ethereum'
    break
  }
  default: {
  }
}

const findIpcPathInLogs = logs => {
  let ipcPath
  for (const logPart of logs) {
    const found = logPart.includes('IPC endpoint opened')
    if (found) {
      ipcPath = logPart.split('=')[1].trim()
      // fix double escaping
      if (ipcPath.includes('\\\\')) {
        ipcPath = ipcPath.replace(/\\\\/g, '\\')
      }
      console.log('Found IPC path: ', ipcPath)
      return ipcPath
    }
  }
  console.log('IPC path not found in logs', logs)
  return null
}

module.exports = {
  type: 'client',
  order: 1,
  displayName: 'Geth',
  name: 'geth',
  repository: 'https://gethstore.blob.core.windows.net',
  modifiers: {
    version: ({ version }) =>
      version
        .split('-')
        .slice(0, -1)
        .join('-')
  },
  filter: {
    name: {
      includes: [platform],
      excludes: ['unstable', 'alltools', 'swarm', 'mips', 'arm']
    }
  },
  prefix: `geth-${platform}`,
  binaryName: process.platform === 'win32' ? 'geth.exe' : 'geth',
  resolveIpc: logs => findIpcPathInLogs(logs),
  settings: [
    {
      id: 'network',
      default: 'main',
      label: 'Network',
      options: [
        { value: 'main', label: 'Main', flag: '' },
        { value: 'ropsten', label: 'Ropsten (testnet)', flag: '--testnet' },
        { value: 'rinkeby', label: 'Rinkeby (testnet)', flag: '--rinkeby' },
        { value: 'goerli', label: 'Görli (testnet)', flag: '--goerli' },
        { value: 'dev', label: 'Local (dev mode)', flag: '--dev' }
      ]
    },
    {
      id: 'syncMode',
      default: 'light',
      label: 'Sync Mode',
      options: [
        { value: 'fast', label: 'Fast' },
        { value: 'full', label: 'Full' },
        { value: 'light', label: 'Light' }
      ],
      flag: '--syncmode %s'
    },
    {
      id: 'dataDir',
      default: dataDir,
      label: 'Data Directory',
      flag: '--datadir %s',
      type: 'directory'
    },
    {
      id: 'keystoreDir',
      default: keystoreDir,
      label: 'Keystore Directory',
      flag: '--keystore %s',
      type: 'directory'
    },
    {
      id: 'console',
      label: 'Enable Console',
      default: 'false',
      options: [
        { value: 'true', flag: 'console', label: 'Yes' },
        { value: 'false', flag: '', label: 'No' }
      ]
    },
    {
      id: 'rpc',
      default: 'none',
      label: 'HTTP RPC API',
      options: [
        { value: 'none', label: 'Disabled', flag: '' },
        {
          value: 'metamask',
          label: 'Enabled for MetaMask',
          flag:
            '--rpc --rpccorsdomain moz-extension://e582a415-cf54-468e-9b4b-f32b576f7bf7,chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn'
        },
        {
          value: 'on',
          label: 'Enabled for All Origins (*)',
          flag: '--rpc --rpccorsdomain=*'
        }
      ]
    },
    {
      id: 'ws',
      default: 'none',
      label: 'WebSockets API',
      options: [
        { value: 'none', label: 'Disabled', flag: '' },
        {
          value: 'on',
          label: 'Enabled for All Origins (*)',
          flag: '--ws --wsorigins=*'
        }
      ]
    },
    {
      id: 'port',
      label: 'P2P Port',
      flag: '--port %s',
      default: '30303'
    },

    {
      id: 'graphql',
      label: 'Enable GraphQL Server',
      default: 'false',
      options: [
        {
          value: 'true',
          flag: '--graphql --graphql.corsdomain=*',
          label: 'Yes, All Origins (*) (Requires Geth >=v1.9.0)'
        },
        { value: 'false', flag: '', label: 'No' }
      ]
    },
    {
      id: 'signer',
      label: 'Signer',
      default: 'none',
      options: [
        { value: 'none', flag: '', label: 'Internal' },
        {
          value: 'clef',
          flag: '--signer http://localhost:8550',
          label: 'Clef (default: localhost:8550)'
        }
      ]
    },
    {
      id: 'usb',
      label: 'Enable USB (hardware wallets)',
      default: 'false',
      options: [
        { value: 'false', flag: '--nousb', label: 'No' },
        { value: 'true', flag: '', label: 'Yes' }
      ]
    },
    {
      id: 'verbosity',
      label: 'Verbosity',
      default: 3,
      options: [
        { value: 0, label: '0 = Silent', flag: '--loglevel=0' },
        { value: 1, label: '1 = Error', flag: '--loglevel=1' },
        { value: 2, label: '2 = Warn', flag: '--loglevel=2' },
        { value: 3, label: '3 = Info', flag: '' }, // Geth's default
        { value: 4, label: '4 = Debug', flag: '--loglevel=4' },
        { value: 5, label: '5 = Detail', flag: '--loglevel=5' }
      ]
    }
  ],
  about: {
    description:
      'Geth is a multipurpose command line tool that runs a full Ethereum node implemented in Go.',
    apps: [
      {
        name: 'Block Explorer',
        url: 'package://github.com/marcgarreau/grid-blocks-app',
        dependencies: [
          {
            name: 'geth',
            settings: [{ id: 'graphql', value: 'true' }]
          }
        ]
      },
      {
        name: 'RPC Tester App',
        url: 'package://github.com/ryanio/grid-rpc-app',
        dependencies: [
          {
            name: 'geth',
            settings: []
          }
        ]
      },
      {
        name: 'GraphQL App',
        url: 'http://localhost:8547'
      }
    ],
    links: [
      {
        name: 'GitHub Repository',
        url: 'https://github.com/ethereum/go-ethereum'
      }
    ],
    docs: [
      {
        name: 'Geth Docs',
        url: 'https://geth.ethereum.org/docs/'
      },
      {
        name: 'Geth Changelog',
        url: 'https://github.com/ethereum/go-ethereum/releases'
      },
      {
        name: 'JSON RPC API Reference',
        url:
          'https://github.com/ethereum/wiki/wiki/JSON-RPC#json-rpc-api-reference'
      }
    ],
    community: [
      {
        name: 'Discord Chat',
        url: 'https://discordapp.com/invite/nthXNEv'
      }
    ]
  }
}

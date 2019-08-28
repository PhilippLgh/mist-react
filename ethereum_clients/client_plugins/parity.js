const HOME = require('os').homedir()
let BASE
switch (process.platform) {
  case 'win32': {
    BASE = `${process.env.USERPROFILE}/AppData/Roaming/Parity/Ethereum`
    break
  }
  case 'linux': {
    BASE = '~/.local/share/io.parity.ethereum'
    break
  }
  case 'darwin': {
    // WARNING don't just use ~/Library/.. here
    BASE = `${HOME}/Library/Application Support/io.parity.ethereum`
    break
  }
  default: {
  }
}

const IPC_PATH = `${BASE}/jsonrpc.ipc`

module.exports = {
  type: 'client',
  order: 2,
  displayName: 'Parity',
  name: 'parity',
  // repository: 'https://github.com/paritytech/parity-ethereum'
  repository: 'https://github.com/evertonfraga/releases-parity',
  prefix: `${process.platform}`, // filter github assets
  binaryName: process.platform === 'win32' ? 'parity.exe' : 'parity',
  resolveIpc: logs => IPC_PATH,
  settings: [
    {
      id: 'network',
      label: 'Network',
      default: 'mainnet',
      options: [
        { value: 'mainnet', label: 'Main', flag: '--chain mainnet' },
        {
          value: 'ropsten',
          label: 'Ropsten (testnet)',
          flag: '--chain ropsten'
        },
        { value: 'kovan', label: 'Kovan (testnet)', flag: '--chain kovan' },
        { value: 'goerli', label: 'Görli (testnet)', flag: '--chain goerli' },
        { value: 'classic', label: 'Ethereum Classic', flag: '--chain classic' }
      ]
    },
    {
      id: 'syncMode',
      label: 'Sync Mode',
      default: 'warp',
      options: [
        { value: 'warp', label: 'Warp', flag: '' },
        { value: 'light', label: 'Light', flag: '--light' },
        { value: 'nowarp', label: 'Full', flag: '--no-warp' }
      ]
    },
    {
      id: 'ipcPath',
      type: 'directory',
      label: 'IPC Path',
      default: IPC_PATH,
      flag: '--ipc-path %s'
    },
    {
      required: true,
      id: 'noDownload',
      default: 'required',
      options: [{ value: 'required', flag: '--no-download' }]
    },
    {
      required: true,
      id: 'forceDirect',
      default: 'required',
      options: [{ value: 'required', flag: '--force-direct' }]
    }
  ],
  about: {
    description: 'Parity is a robust EVM and WASM client implemented in Rust.',
    apps: [
      {
        name: 'RPC Tester App',
        url: 'package://github.com/ryanio/grid-rpc-app',
        dependencies: [
          {
            name: 'parity',
            settings: []
          }
        ]
      }
    ],
    links: [
      {
        name: 'GitHub Repository',
        url: 'https://github.com/paritytech/parity-ethereum'
      }
    ],
    docs: [
      {
        name: 'Parity Docs',
        url: 'https://wiki.parity.io'
      },
      {
        name: 'JSON RPC API Reference',
        url: 'https://wiki.parity.io/JSONRPC'
      }
    ],
    community: [
      {
        name: 'Riot.im Chat',
        url: 'https://riot.im/app/#/room/#watercooler:matrix.parity.io'
      },
      {
        name: 'Twitter (@ParityTech)',
        url: 'https://twitter.com/ParityTech'
      }
    ]
  }
}

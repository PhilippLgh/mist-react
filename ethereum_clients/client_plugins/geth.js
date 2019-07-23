let platform = 'windows'
let dataDir = `${process.env.APPDATA}/Ethereum`

// Platform specific initialization
switch (process.platform) {
  case 'win32': {
    platform = 'windows'
    dataDir = `${process.env.APPDATA}/Ethereum`
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
  for (const l of logs) {
    const found = l.includes('IPC endpoint opened')
    if (found) {
      ipcPath = l.split('=')[1].trim()
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
      excludes: ['unstable', 'alltools', 'swarm']
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
      options: ['fast', 'full', 'light'],
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
      id: 'console',
      label: 'Enable console',
      default: 'false',
      options: [
        { value: 'true', flag: 'console', label: 'Yes' },
        { value: 'false', flag: '', label: 'No' }
      ]
    },
    {
      id: 'rpc',
      default: 'none',
      label: 'RPC API',
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
          label: 'Enabled for all origins',
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
          label: 'Enabled for all origins',
          flag: '--ws --wsorigins=*'
        }
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
    },
    {
      id: 'graphql',
      label: 'Enable GraphQL',
      default: 'false',
      options: [
        { value: 'true', flag: '--graphql', label: 'Yes (v1.9.0 and later)' },
        { value: 'false', flag: '', label: 'No' }
      ]
    }
  ]
}

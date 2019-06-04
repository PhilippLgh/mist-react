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
      id: 'dataDir',
      default: dataDir,
      label: 'Data Directory',
      flag: '--datadir %s',
      type: 'path'
    },
    {
      id: 'api',
      default: 'ipc',
      label: 'API',
      options: [
        { value: 'ipc', label: 'IPC', flag: '' },
        { value: 'websockets', label: 'WebSockets', flag: '--ws' },
        { value: 'rpc', label: 'RPC HTTP', flag: '--rpc' }
      ]
    },
    {
      id: 'network',
      default: 'main',
      label: 'Network',
      options: [
        { value: 'main', label: 'Main', flag: '' },
        { value: 'ropsten', label: 'Ropsten (testnet)', flag: '--testnet' },
        { value: 'rinkeby', label: 'Rinkeby (testnet)', flag: '--rinkeby' }
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
      id: 'cache',
      default: '2048',
      label: 'Cache',
      flag: '--cache %s'
    }
  ]
}

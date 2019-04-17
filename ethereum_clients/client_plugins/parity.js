function findIpcPath() {
  let ipcPath

  switch (process.platform) {
    case 'win32': {
      ipcPath = `${process.env.APPDATA}\\Local\\Parity\\Ethereum\\jsonrpc.ipc`
    }
    case 'linux': {
      ipcPath = `~/.local/share/io.parity.ethereum/jsonrpc.ipc`
    }
    case 'darwin': {
      ipcPath = `~/Library/Application\ Support/io.parity.ethereum/jsonrpc.ipc`
    }
    default: {
    }
  }

  return ipcPath
}

module.exports = {
  type: 'client',
  order: 2,
  displayName: 'Parity',
  name: 'parity',
  // repository: 'https://github.com/paritytech/parity-ethereum'
  repository: 'https://github.com/PhilippLgh/EthCapetownWorkshop',
  prefix: `${process.platform}`, // filter github assets
  binaryName: process.platform === 'win32' ? 'parity.exe' : 'parity',
  resolveIpc: () => findIpcPath()
}

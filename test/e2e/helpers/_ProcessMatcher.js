import psList from 'ps-list'

const getProcess = async name => {
  const processes = await psList({ all: false })
  return processes.find(e => e.name === name)
}

const getProcessFlags = async name => {
  const p = await getProcess(name)
  const flags = p.cmd.split(' ')
  flags.shift()
  return flags
}

export { getProcess, getProcessFlags }

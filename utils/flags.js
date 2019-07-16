/**
 * This method preserves spaces contained in the value.
 * input: "--ipc '%s'", "/path with spaces"
 * output: ["--ipc", "/path with spaces"]
 */
const parseFlag = (pattern, value) => {
  let result = pattern.split(' ').map(e => e.replace(/%s/, value))

  return result
}

const generateFlags = (userConfig, nodeSettings) => {
  if (!Array.isArray(nodeSettings))
    throw new Error('Settings must be an Array instance')

  const userConfigEntries = Object.keys(userConfig)
  let flags = []

  userConfigEntries.forEach(entry => {
    let pattern
    let configEntry = nodeSettings.find(setting => setting.id === entry)
    let flagString = configEntry.flag

    if (flagString) {
      pattern = flagString
    } else if (configEntry.options) {
      const options = configEntry.options
      const selectedOption = options.find(
        option =>
          userConfig[entry] === option.value || userConfig[entry] === option
      )
      if (typeof selectedOption['flag'] !== 'string') {
        throw new Error(
          `Option "${selectedOption.value ||
            selectedOption}" must have the "flag" key`
        )
      }
      pattern = selectedOption.flag
    } else {
      throw new Error(`Config entry "${entry}" must have the "flag" key`)
    }

    const parsedFlag = parseFlag(pattern, userConfig[entry])
    flags = flags.concat(parsedFlag)
  })

  return flags.filter(flag => flag.length > 0)
}

module.exports = generateFlags

const is = {
  dev: () =>
    process.env.NODE_ENV && process.env.NODE_ENV.trim() == 'development',
  prod: () => !is.dev()
}

module.exports = is

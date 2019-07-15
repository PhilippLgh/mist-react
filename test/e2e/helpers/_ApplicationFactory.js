import { Application } from 'spectron'
import * as path from 'path'

const debug = false

class ApplicationFactory {
  static development() {
    const params = {
      path: path.resolve('./node_modules/.bin/electron'),
      args: [path.resolve('./index.js')],
      requireName: 'electronRequire'
    }

    debug && console.log('development() app parameters', params)
    return new Application(params)
  }

  static release() {
    const params = {
      path: path.resolve('./release/mac/Grid.app/Contents/MacOS/Grid')
    }
    debug && console.log('installed() app parameters', params)
    return new Application(params)
  }

  static installed() {
    const params = {
      path: '/Applications/Grid.app/Contents/MacOS/Grid'
    }
    debug && console.log('installed() app parameters', params)
    return new Application(params)
  }
}
export default ApplicationFactory

import * as path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'

const rmGethDir = function () {
  try {
    const files = fs.readdirSync(path.resolve('./ethereum_clients/bin_geth/'))
    files.map(e => fs.unlinkSync(path.resolve(`./ethereum_clients/bin_geth/${e}`)))
  }
  catch(e) {
    console.log('rmGeth', e);
  }
}

const clearBinDir = function () {
  rimraf.sync('./ethereum_clients/bin_*')
}

const delay = time => new Promise(resolve => setTimeout(resolve, time));

export { rmGethDir, clearBinDir }

import test from 'ava'
import ApplicationFactory from './_ApplicationFactory'
import ClientAppBar from './_ClientAppBar'
import MainAppBar from './_MainAppBar'
import VersionList from './_VersionList'
import { rmGethDir, clearBinDir } from './_TestUtils'
import Node from './_Node'
import ClientSettingsForm from './_ClientSettingsForm'
import {getProcess, getProcessFlags} from './_ProcessMatcher'

const init = async function(t) {
  const app = t.context.app
  await app.client.waitUntilWindowLoaded(20000)
  const win = app.browserWindow
  const client = app.client
  return { app, win, client }
}

test.beforeEach(async t => {
  // rmGethDir()
  clearBinDir()

  t.context.app = ApplicationFactory.development()

  await t.context.app.start()
})

test.afterEach.always(async t => {
  await t.context.app.stop()
})

test('As a user, I want to download a geth node', async t => {
  const {app, client, win} = await init(t)
  const versionList = new VersionList(app.client)

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionDownloading(0)
  await versionList.waitUntilVersionSelected(0)

  t.pass()
})

test('As a user, I want to start/stop my geth node from the app UI', async t => {
  const {app, client, win} = await init(t)
  const versionList = new VersionList(app.client)
  const node = new Node(app.client)

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionSelected(0)

  await node.toggle('geth')
  await node.waitUntilStarted()

  const startedGeth = await getProcess('geth')
  t.assert(startedGeth.pid > 0)

  await node.toggle('geth')
  await node.waitUntilStopped()

  t.pass()
})

test('As a user, I want to configure Geth settings', async t => {
  const {app, client, win} = await init(t)
  const versionList = new VersionList(app.client)
  const node = new Node(app.client)
  const clientAppBar = new ClientAppBar(app.client)
  const settings = new ClientSettingsForm(app.client)

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionSelected(0)

  await clientAppBar.settings.click()
  await settings.getPathInput('dataDir').setValue('/tmp/datadir')
  await settings.getInput('cache').setValue('1337')
  await settings.chooseSelectOption('syncMode', 'light')
  await settings.chooseSelectOption('api', 'websockets')
  await settings.chooseSelectOption('network', 'rinkeby')

  await node.toggle('geth')
  await node.waitUntilStarted()

  const gethFlags = await getProcessFlags('geth')
  const gf = gethFlags.join(' ')
  // t.assert(gethFlags == '--datadir', '/tmp/datadir', '--syncmode', 'light', '--rpcapi', 'websockets', '--rinkeby', '--cache', '1337')
  t.assert(/--datadir \/tmp\/datadir/.test(gf))
  t.assert(/--syncmode light/.test(gf))
  t.assert(/--ws/.test(gf))
  t.assert(/--rinkeby/.test(gf))
  t.assert(/--cache 1337/.test(gf))
})

test('As a user, I want to know if my client is up to date', async t => {
  const {app, client, win} = await init(t)
  const versionList = new VersionList(app.client)

  await versionList.waitToLoad()

  await versionList.clickOnItem(1)
  await versionList.waitUntilVersionSelected(1)

  await client.waitForVisible('[role=alertdialog]')

  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionSelected(0)

  await client.waitForVisible('[role=alertdialog]', 500, true)

  t.pass()
})

test('As a user, I want to see sync status visually', async t => {
  t.fail('Not implemented.')
})

test('As a user, I want to have the connection details remembered', async t => {
  const {app, client, win} = await init(t)
  const versionList = new VersionList(app.client)
  const clientAppBar = new ClientAppBar(app.client)
  const settings = new ClientSettingsForm(app.client)

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionSelected(0)

  await clientAppBar.settings.click()
  await settings.getPathInput('dataDir').setValue('/tmp/ac5718')

  // Restart the app
  await app.stop()
  t.context.app = ApplicationFactory.development()
  const app2 = t.context.app
  await t.context.app.start()

  const clientAppBar2 = new ClientAppBar(app2.client)
  await clientAppBar2.settings.click()

  const settings2 = new ClientSettingsForm(app2.client)
  const dataDirValue = await settings2.getPathInput('dataDir').getValue()

  t.is(dataDirValue, '/tmp/ac5718')
})


// OK - As a user, I want to download a geth node
// OK - As a user, I want to start/stop my geth node from the app UI. #38
// OK - As a user, I want to configure my node settings and options easily. #37
// OK - As a user, I want to be notified when a new version of my node is available, so I don't fork. #22
// OK - As a user, I want to provide an existing network data directory, so that I don't have two copies of the network. #35

// As a user, I want to have the connection details remembered, so I can have a consistent use of the app #23

// Waiting for PR
// As a user, I want to see sync status visually, so I don't have to parse the logs and guess #73

// Should be tested
// As a user, I want to download codesigned applications, so it works without nasty warnings on my OS #114

// As a developer, I want to test Grid-UI build channels from the Grid [shell] interface, so we can ensure app quality standards #87
// - Spectron menu plugin
// - Retrieve grid-ui version from renderer process

// As a user, I want to be reminded of updates on the app itself, so I can get latest features and fixes. #33
// - mock updater
//

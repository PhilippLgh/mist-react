import test from 'ava'
import ApplicationFactory from './_ApplicationFactory'
import ClientAppBar from './_ClientAppBar'
import MainAppBar from './_MainAppBar'
import VersionList from './_VersionList'
import { rmGethDir, clearBinDir } from './_TestUtils'
import Node from './_Node'
import ClientSettingsForm from './_ClientSettingsForm'
import { getProcess, getProcessFlags } from './_ProcessMatcher'

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
  const { app, client, win } = await init(t)
  const versionList = new VersionList(app.client)

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionDownloading(0)
  await versionList.waitUntilVersionSelected(0)

  t.pass()
})

// #38
test('As a user, I want to start/stop my geth node from the app UI', async t => {
  const { app, client, win } = await init(t)
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

// #37
test('As a user, I want to configure Geth settings', async t => {
  const { app, client, win } = await init(t)
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

  t.assert(/--datadir \/tmp\/datadir/.test(gf))
  t.assert(/--syncmode light/.test(gf))
  t.assert(/--ws/.test(gf))
  t.assert(/--rinkeby/.test(gf))
  t.assert(/--cache 1337/.test(gf))
})

// #22
test('As a user, I want to know if my client is up to date', async t => {
  const { app, client, win } = await init(t)
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

// #23
test.failing(
  'As a user, I want to have the connection details remembered',
  async t => {
    let { app, client, win } = await init(t)
    const versionList = new VersionList(client)
    const clientAppBar = new ClientAppBar(client)
    const settings = new ClientSettingsForm(client)

    await clientAppBar.settings.click()
    await settings.getPathInput('dataDir').setValue('/tmp/ac5718')

    // Restart the app
    await app.stop()

    const app2 = ApplicationFactory.development()
    t.context.app = app2
    await app2.start()
    const client2 = app2.client
    await client2.waitUntilWindowLoaded(20000)

    const clientAppBar2 = new ClientAppBar(client2)
    await clientAppBar2.settings.click()

    const settings2 = new ClientSettingsForm(client2)
    const dataDirValue = await settings2.getPathInput('dataDir').getValue()

    t.is(dataDirValue, '/tmp/ac5718')
  }
)

test.todo('As a user, I want to see sync status visually #73')
test.todo('As a user, I want to download codesigned applications #114')
test.todo(
  'As a developer, I want to test Grid-UI build channels from the Grid [shell] interface #87'
)
test.todo(
  'As a user, I want to be reminded of Grid updates, so I can get latest features and fixes. #33'
)

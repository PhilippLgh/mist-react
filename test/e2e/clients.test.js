import test from 'ava'

import ApplicationFactory from './helpers/_ApplicationFactory'
import ClientSettingsForm from './helpers/_ClientSettingsForm'
import { getProcessFlags } from './helpers/_ProcessMatcher'
import ClientAppBar from './helpers/_ClientAppBar'
import { clearBinDir } from './helpers/_TestUtils'
import VersionList from './helpers/_VersionList'
import Node from './helpers/_Node'

const init = async function(t) {
  const app = t.context.app
  await app.client.waitUntilWindowLoaded(20000)
  const win = app.browserWindow
  const client = app.client
  return { app, win, client }
}

test.beforeEach(async t => {
  clearBinDir()

  t.context.app = ApplicationFactory.development()

  await t.context.app.start()
})

test.afterEach.always(async t => {
  if (t.context.app.running === true) {
    await t.context.app.stop()
  }
})

test('Parity config to flags', async t => {
  const { app, client, win } = await init(t)
  const versionList = new VersionList(app.client)
  const node = new Node(app.client)
  const clientAppBar = new ClientAppBar(app.client)
  const settings = new ClientSettingsForm(app.client)

  await versionList.waitToLoad()

  await node.select('parity')

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionSelected(0)

  await clientAppBar.settings.click()

  const defaultIpcPathValue = await settings.getPathInput('ipcPath').getValue()

  await node.toggle('parity')
  await node.waitUntilStarted()

  const parityFlags = await getProcessFlags('parity')
  const gf = parityFlags.join(' ')

  t.true(gf.includes(`--ipc-path ${defaultIpcPathValue}`))

  await node.toggle('parity')
})

const clientShouldStopWhenAppIsClosedMacro = async (t, input) => {
  const { app } = await init(t)
  const versionList = new VersionList(app.client)
  const node = new Node(app.client)
  const CLIENT = input

  await versionList.waitToLoad()

  await node.select(CLIENT)

  await versionList.waitToLoad()
  await versionList.clickOnItem(0)
  await versionList.waitUntilVersionSelected(0)

  await node.toggle(CLIENT)

  await node.waitUntilStarted()

  await app.stop()

  await node.waitUntilProcessExited(CLIENT, 10000)

  t.pass()
}
clientShouldStopWhenAppIsClosedMacro.title = (
  title = 'should stop when app is closed',
  input
) => `${input} ${title}`

/**
 * The tests below use Macro:
 * https://github.com/avajs/ava/blob/master/docs/01-writing-tests.md#reusing-test-logic-through-macros
 *
 * You can run a single test with the following command:
 * yarn test:e2e -m 'parity should stop when app is closed'
 */
test(clientShouldStopWhenAppIsClosedMacro, 'geth')
test(clientShouldStopWhenAppIsClosedMacro, 'aleth')
test.failing(clientShouldStopWhenAppIsClosedMacro, 'parity')

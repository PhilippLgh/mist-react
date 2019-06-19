import { isUndefined } from 'util'
import { getProcess } from './_ProcessMatcher'

class Node {
  constructor(client) {
    this.client = client
  }

  toggle(nodeName) {
    return this.client.click(`[data-test-id=switch-${nodeName}]`)
  }

  select(nodeName) {
    return this.client.click(`[data-test-id=node-${nodeName}]`)
  }

  waitUntilStarted() {
    return this.client.waitUntilTextExists(
      '[data-test-id=node-state]',
      'STARTED',
      5000
    )
  }

  waitUntilStopped() {
    return this.client.waitUntilTextExists(
      '[data-test-id=node-state]',
      'STOPPED',
      3000
    )
  }

  waitUntilProcessExited(processName, delay = 10000) {
    return this.client.waitUntil(async () => {
      const process = await getProcess(processName)
      return isUndefined(process)
    }, delay)
  }
}

export default Node

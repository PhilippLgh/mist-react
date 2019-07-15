const DELAY_FACTOR = 3

class VersionList {
  constructor(client) {
    this.client = client
  }

  get items() {
    return this.client.$$('[data-test-id=version-list] > [role=button]')
  }

  get self() {
    return this.client.$('[data-test-id=version-list]')
  }

  get localItems() {
    return this.client.$$(
      '[data-test-id=version-list] > [data-test-is-downloaded=true]'
    )
  }

  get remoteItems() {
    // return this.client.$(`[data-test-id=version-list] > [role=button]:nth-child(3)`)

    return this.client.$$(
      '[data-test-id=version-list] > [data-test-is-downloaded=false]'
    )
  }

  get selectedItem() {
    return this.client.$(this.selectedItemSelector)
  }

  get selectedItemSelector() {
    return '[data-test-id=version-list] > [data-test-is-selected=true]'
  }

  get refreshButton() {
    return this.client.$('[data-test-id=button-refresh-version-list]')
  }

  get refreshButtonLoading() {
    return this.client.$('[data-test-id=button-refresh-version-list-loading]')
  }

  itemAt(index) {
    // nth-child is not zero-based
    index++
    return this.client.$(
      `[data-test-id=version-list] > [role=button]:nth-child(${index})`
    )
  }

  // Actions
  clickOnItem(index = 0) {
    // nth-of-type is not zero-based
    index++
    return this.client
      .$('[data-test-id=version-list]')
      .$(`[role=button]:nth-of-type(${index})`)
      .click()
  }

  // Events
  waitToLoad() {
    return this.client.waitForExist(
      `[data-test-id=version-list] > *`,
      DELAY_FACTOR * 7500
    )
  }

  waitUntilVersionSelected(index = 0) {
    // nth-child is not zero-based
    index++
    return this.client.waitUntilTextExists(
      `[data-test-id=version-list] [role=button]:nth-child(${index}) span span`,
      'SELECTED',
      DELAY_FACTOR * 20000
    )
  }

  waitUntilVersionDownloading(index = 0) {
    // nth-child is not zero-based
    index++
    return this.client.waitUntilTextExists(
      `[data-test-id=version-list] [role=button]:nth-child(${index}) span span`,
      'DOWNLOADING',
      DELAY_FACTOR * 1000
    )
  }
}

export default VersionList

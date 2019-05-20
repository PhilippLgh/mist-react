class ClientSettingsForm {
  constructor (client) {
    this.client = client
  }

  getInput(name) {
    return this.client.element(`[data-test-id=input-text-${name}] input`)
  }

  getPathInput(name) {
    return this.client.element(`[data-test-id=input-path-${name}] input`)
  }

  getSelect(name) {
    return this.client.element(`[data-test-id=input-select-${name}] [role=button]`)
  }

  async chooseSelectOption(name, value) {
    await this.getSelect(name).click()
    await this.selectPopupMenuOptionByValue(value).click()
    await this.waitUntilModalIsClosed()
  }

  selectPopupMenuOptionByValue(value) {
    return this.client.$('div[role=presentation]').$(`[data-value=${value}]`)
  }

  waitUntilModalIsClosed() {
    return this.client.waitUntil(async () => (await this.client.$('div[role=presentation]')).state === 'failure')
  }
}

export default ClientSettingsForm

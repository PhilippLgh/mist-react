import AppBar from './_AppBar'

class MainAppBar extends AppBar {
  constructor(client) {
    super(client)
  }
  get nodes() {
    return this.selectElement('nodes')
  }
  get network() {
    return this.selectElement('network')
  }
  get transactions() {
    return this.selectElement('transactions')
  }
  get tools() {
    return this.selectElement('tools')
  }
  get webview() {
    return this.selectElement('webview')
  }
  selectElement(el) {
    return this.client.element(`[data-test-id=navbar-item-${el}]`)
  }
}

export default MainAppBar

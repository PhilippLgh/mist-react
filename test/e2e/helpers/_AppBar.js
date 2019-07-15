class AppBar {
  constructor(client) {
    this.client = client
  }
  selectElement(el) {
    return this.client.element(`[data-test-id=navbar-item-${el}]`)
  }
}

export default AppBar

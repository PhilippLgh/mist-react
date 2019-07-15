import AppBar from './_AppBar'

class ClientAppBar extends AppBar {
  constructor(client) {
    super(client)
  }
  get version() {
    return this.selectElement('version')
  }
  get settings() {
    return this.selectElement('settings')
  }
  get terminal() {
    return this.selectElement('terminal')
  }
}

export default ClientAppBar

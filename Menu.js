const { app } = require('electron')
const { startConfigEditor } = require('./Config')

module.exports.getMenuTemplate = () => {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      label: 'Config',
      submenu: [
        {
          label: 'Edit',
          click() {
            startConfigEditor()
          }
        }
      ]
    },
    {
      label: 'Plugins',
      submenu: [
        {
          label: 'Rescan',
          click() {
            if (!global.PluginHost) {
              console.log('plugin host not ready')
              return
            }
            global.PluginHost.loadUserRegistries()
          }
        }
      ]
    },
    {
      label: 'Updater',
      submenu: [
        // dynamically filled
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More...',
          click() {
            require('electron').shell.openExternal('https://grid.ethereum.org')
          }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }

  return template
}

const path = require('path')
const { menubar } = require('menubar')

const mb = menubar({
  index: path.join(__dirname, 'ui', 'nano.html'),
  browserWindow: {
    alwaysOnTop: true // good for debugging
  }
})

mb.on('ready', () => {
  console.log('app is ready')
  // your app code here
})

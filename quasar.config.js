const { configure } = require('quasar/wrappers')

module.exports = configure(function () {
  return {
    boot: [],
    css: [],
    extras: ['material-icons'],
    build: {
      target: { browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'], node: 'node20' },
      vueRouterMode: 'hash'
    },
    devServer: { open: true },
    framework: {
      plugins: ['Notify', 'Dialog', 'AppVisibility']
    }
  }
})

const { configure } = require('quasar/wrappers')

module.exports = configure(function () {
  return {
    boot: [],
    css: [],
    extras: ['material-icons'],
    build: {
      target: { node: 'node20' },
      vueRouterMode: 'hash'
    },
    devServer: { open: true },
    framework: {
      plugins: ['Notify', 'Dialog', 'AppVisibility']
    }
  }
})

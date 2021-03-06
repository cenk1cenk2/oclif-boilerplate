// eslint-disable-next-line import/order
const inspector = require('inspector')
// eslint-disable-next-line import/order
const path = require('path')

// overwrite debug and silent logger and listr through config
const debug = process.argv.indexOf('--debug')
const silent = process.argv.indexOf('--silent')
const inspect = process.argv.indexOf('--inspect')
const sourceMaps = process.argv.indexOf('--source-map')
const verbose = process.argv.indexOf('--verbose')

// debug port
if (inspect !== -1) {
  inspector.open()
  process.argv.splice(inspect, 1)
}

// log levels, with single variable instead of the config plugin
if (verbose !== -1) {
  process.env.LOG_LEVEL = 'verbose'
  process.argv.splice(verbose, 1)
}

if (debug !== -1) {
  process.env.LOG_LEVEL = 'debug'
  process.argv.splice(debug, 1)
}

if (silent !== -1) {
  process.env.LOG_LEVEL = 'silent'
  process.argv.splice(silent, 1)
}

// source map support
if (sourceMaps !== -1) {
  require('source-map-support').install()
  process.argv.splice(sourceMaps, 1)
}

// initiate config directory for npm plugin config
// config module jumps on top of anything so we have to initate it before running
process.env.NODE_CONFIG_DIR = path.join(path.dirname(require.main.filename), '../config')

// disable ts_node and use compiled versions only
process.env.OCLIF_TS_NODE = 0

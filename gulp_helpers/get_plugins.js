const path = require('path');
const yargs = require('yargs');
const glob = require('glob');

/*
  Usage:
    Specifying which plugins to run tests can be done with the --plugins flag.
    One of more plugins can be specified, and each one should be comman separated, like so:
      gulp testserver --plugins monitoring,reporting
    If using with npm, you'll need an addition -- to pass the argument:
      npm run testserver -- --plugins graph
*/

const argv = yargs
  .describe('plugins', 'Comma-separated list of plugins')
  .argv;
const allPlugins = glob.sync('*', { cwd: path.resolve(__dirname, '..', 'plugins') });

module.exports = function getPlugins() {
  const plugins = argv.plugins && argv.plugins.split(',');
  if (!Array.isArray(plugins) || plugins.length === 0) {
    return allPlugins;
  }
  return plugins;
};
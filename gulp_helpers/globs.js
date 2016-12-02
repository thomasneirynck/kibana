var yargs = require('yargs');

var argv = yargs
  .describe('plugins', 'Comma-separated list of plugins')
  .argv;

function getPluginPaths(extensions, opts = {}) {
  const testPath = opts.tests ? '/__test__/**' : '';
  if (extensions.length === 0) extensions.push('js');

  if (opts.plugins) {
    return opts.plugins.reduce((paths, plugin) => {
      const pluginPath = `${plugin.trim()}/**`;
      const rootPath = `./plugins/${pluginPath}${testPath}`;
      const extensionPaths = extensions.map(extension => `${rootPath}/*.${extension}`);

      return paths.concat(extensionPaths);
    }, []);
  }

  const pluginPath = '**';
  const rootPath = `./plugins/${pluginPath}${testPath}`;

  return extensions.map(extension => `${rootPath}/*.${extension}`);
}

function getPlugins() {
  const plugins = argv.plugins && argv.plugins.split(',');
  if (!Array.isArray(plugins) || plugins.length === 0) {
    return false;
  }
  return plugins;
}

exports.forPlugins = function (...extensions) {
  const plugins = getPlugins();
  return getPluginPaths(extensions, { plugins });
};

exports.forPluginTests = function (...extensions) {
  const plugins = getPlugins();
  return getPluginPaths(extensions, { plugins, tests: true });
};

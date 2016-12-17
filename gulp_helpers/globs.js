const getPlugins = require('./get_plugins');

function getPluginPaths(plugins, extensions, opts = {}) {
  const testPath = opts.tests ? '/__tests__/**' : '';
  if (extensions.length === 0) extensions.push('js');

  return plugins.reduce((paths, plugin) => {
    const pluginPath = `${plugin.trim()}/**`;
    const publicPath = `${plugin.trim()}/public`;
    const rootPath = `./plugins/${pluginPath}${testPath}`;
    const excludePublicPaths = (!opts.browser) ? [`!./plugins/${publicPath}/**`] : [];
    const extensionPaths = extensions.map(extension => `${rootPath}/*.${extension}`);

    return paths.concat(extensionPaths).concat(excludePublicPaths);
  }, []);
}

exports.forPlugins = function (...extensions) {
  const plugins = getPlugins();
  return getPluginPaths(plugins, extensions, { browser: true });
};

exports.forPluginServerTests = function (...extensions) {
  const plugins = getPlugins();
  return getPluginPaths(plugins, extensions, { tests: true });
};
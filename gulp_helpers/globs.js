const getPlugins = require('./get_plugins');

function getPluginPaths(plugins, extensions, opts = {}) {
  const testPath = opts.tests ? '/__tests__/**' : '';
  if (extensions.length === 0) extensions.push('js');

  return plugins.reduce((paths, plugin) => {
    const serverPath = `${plugin.trim()}/server`;
    const publicPath = `${plugin.trim()}/public`;

    const serverPaths = extensions.map(extension => `plugins/${serverPath}/**${testPath}/*.${extension}`);

    if (!opts.browser) {
      return paths.concat(serverPaths);
    }

    const publicPaths = extensions.map(extension => `plugins/${publicPath}/**${testPath}/*.${extension}`);
    return paths.concat(serverPaths).concat(publicPaths);
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
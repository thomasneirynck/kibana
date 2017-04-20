const getPlugins = require('./get_plugins');

function getPluginPaths(plugins, extensions, opts = {}) {
  const testPath = opts.tests ? '/__tests__/**' : '';
  if (extensions.length === 0) extensions.push('js');

  return plugins.reduce((paths, pluginName) => {
    const plugin = pluginName.trim();
    const commonPath = `${plugin}/common`;
    const serverPath = `${plugin}/server`;
    const publicPath = `${plugin}/public`;

    const commonPaths = extensions.map(extension => `plugins/${commonPath}/**${testPath}/*.${extension}`);
    const publicPaths = extensions.map(extension => `plugins/${publicPath}/**${testPath}/*.${extension}`);
    const serverPaths = extensions.map(extension => `plugins/${serverPath}/**${testPath}/*.${extension}`);

    paths = paths.concat([`plugins/${plugin}/*.js`]); // index and helpers
    paths = paths.concat(commonPaths);
    paths = paths.concat(serverPaths);

    if (opts.browser) {
      paths = paths.concat(publicPaths);
    }

    return paths;
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

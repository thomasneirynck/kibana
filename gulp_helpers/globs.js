const getPlugins = require('./get_plugins');

function getPluginPaths(plugins, extensions, opts = {}) {
  const testPath = opts.tests ? '/__tests__/**' : '';
  if (extensions.length === 0) extensions.push('js');

  return plugins.reduce((paths, plugin) => {
    const commonPath = `${plugin.trim()}/common`;
    const serverPath = `${plugin.trim()}/server`;
    const publicPath = `${plugin.trim()}/public`;

    const commonPaths = extensions.map(extension => `plugins/${commonPath}/**${testPath}/*.${extension}`);
    const publicPaths = extensions.map(extension => `plugins/${publicPath}/**${testPath}/*.${extension}`);
    const serverPaths = extensions.map(extension => `plugins/${serverPath}/**${testPath}/*.${extension}`);

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

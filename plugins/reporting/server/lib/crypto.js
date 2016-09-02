import oncePerServer from './once_per_server';

function cryptoFactory(server) {
  const encryptionKey = server.config().get('xpack.reporting.encryptionKey');
  return server.plugins.kibana.crypto({
    encryptionKey
  });
}

module.exports = oncePerServer(cryptoFactory);

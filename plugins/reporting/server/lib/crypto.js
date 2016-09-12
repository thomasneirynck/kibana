import oncePerServer from './once_per_server';
import nodeCrypto from '@elastic/node-crypto';

function cryptoFactory(server) {
  const encryptionKey = server.config().get('xpack.reporting.encryptionKey');
  return nodeCrypto({ encryptionKey });
}

module.exports = oncePerServer(cryptoFactory);

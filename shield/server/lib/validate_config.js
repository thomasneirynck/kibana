export default (config) => {
  if (config.get('xpack.shield.encryptionKey') == null) {
    throw new Error('shield.encryptionKey is required in kibana.yml.');
  }

  const isSslConfigured = config.get('server.ssl.key') != null && config.get('server.ssl.cert') != null;
  if (!isSslConfigured && !config.get('xpack.shield.skipSslCheck')) {
    throw new Error('HTTPS is required. Please set server.ssl.key and server.ssl.cert in kibana.yml.');
  }
};

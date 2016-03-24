export default (config, log) => {
  if (config.get('shield.encryptionKey') == null) {
    throw new Error('shield.encryptionKey is required in kibana.yml.');
  }

  const isSslConfigured = config.get('server.ssl.key') != null && config.get('server.ssl.cert') != null;
  if (config.get('shield.skipSslCheck')) {
    log('Skipping Kibana server SSL check');
    log('SSL is still required for this plugin to function');
  } else if (!isSslConfigured) {
    throw new Error('HTTPS is required. Please set server.ssl.key and server.ssl.cert in kibana.yml.');
  }
};

export default (config, log) => {
  if (config.get('xpack.security.encryptionKey') == null) {
    log('Generating a random key for xpack.security.encryptionKey');
    log('To prevent sessions from being invalidated on restart, please set xpack.security.encryptionKey in kibana.yml');
    config.set('xpack.security.encryptionKey', Math.random().toString(36).slice(2));
  }

  const isSslConfigured = config.get('server.ssl.key') != null && config.get('server.ssl.cert') != null;
  if (config.get('xpack.security.skipSslCheck')) {
    log('Skipping Kibana server SSL check');
    if (!config.get('xpack.security.useUnsafeSessions')) log('Note that SSL is required for this plugin to function');
  } else if (!isSslConfigured) {
    throw new Error('HTTPS is required. Please set server.ssl.key and server.ssl.cert in kibana.yml.');
  }

  if (config.get('xpack.security.useUnsafeSessions')) log('Operating with insecure sessions, this is not recommended');
};

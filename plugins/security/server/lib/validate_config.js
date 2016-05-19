import uuid from 'node-uuid';

export default (config, log) => {
  if (config.get('xpack.security.encryptionKey') == null) {
    log('Generating a random key for xpack.security.encryptionKey');
    log('To prevent sessions from being invalidated on startup, please set xpack.security.encryptionKey in kibana.yml');
    config.set('xpack.security.encryptionKey', uuid.v4());
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

export default (config, log) => {
  if (config.get('xpack.security.encryptionKey') == null) {
    log('Generating a random key for xpack.security.encryptionKey. To prevent sessions from being invalidated on ' +
      'restart, please set xpack.security.encryptionKey in kibana.yml');
    config.set('xpack.security.encryptionKey', Math.random().toString(36).slice(2));
  }

  const isSslConfigured = config.get('server.ssl.key') != null && config.get('server.ssl.cert') != null;
  if (!isSslConfigured) {
    if (config.get('xpack.security.secureCookies')) {
      log('Using secure cookies, but SSL is not enabled inside Kibana. SSL must be configured outside of Kibana to ' +
        'function properly.');
    } else {
      log('Session cookies will be transmitted over insecure connections. This is not recommended.');
    }
  } else {
    config.set('xpack.security.secureCookies', true);
  }
};

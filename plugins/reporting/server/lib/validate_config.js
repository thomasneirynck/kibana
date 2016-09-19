module.exports = (config, log) => {
  if (config.get('xpack.reporting.encryptionKey') == null) {
    log('Generating a random key for xpack.reporting.encryptionKey. To prevent pending reports from failing on ' +
      'restart, please set xpack.reporting.encryptionKey in kibana.yml');
    config.set('xpack.reporting.encryptionKey', Math.random().toString(36).slice(2));
  }

  const syncSocketTimeout = config.get('xpack.reporting.queue.syncSocketTimeout');
  if (syncSocketTimeout != null) {
    const message = 'xpack.reporting.queue.syncSocketTimeout has been deprecated.'
      + ' Please use xpack.reporting.generate.socketTimeout instead.';
    log (message);
    config.set('xpack.reporting.generate.socketTimeout', syncSocketTimeout);
  }
};

module.exports = (config, log) => {
  if (config.get('xpack.reporting.encryptionKey') == null) {
    log('Generating a random key for xpack.reporting.encryptionKey. To prevent pending reports from failing on ' +
      'restart, please set xpack.reporting.encryptionKey in kibana.yml');
    config.set('xpack.reporting.encryptionKey', Math.random().toString(36).slice(2));
  }
};

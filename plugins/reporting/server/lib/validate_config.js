// We use this module instead of relying on Joi's required() function because
// that throws a generic and very large exception in the logs. By contrast, this
// module lets us thrown a shorter and more meaningful (Kibana-specific) and actionable
// exception instead.
module.exports = config => {
  if (config.get('xpack.reporting.encryptionKey') == null) {
    throw new Error('xpack.reporting.encryptionKey is required in kibana.yml.');
  }
};

var _ = require('lodash');

const methods = {
  checkConnection: function () {
    return this.info()
    .catch(function (err) {
      throw new Error('Can not communicate with Elasticsearch');
    });
  }
};

module.exports = function createClient(elasticsearch, config) {
  const username = config.get('reporting.auth.username');
  const password = config.get('reporting.auth.password');
  let opts = { auth: false };

  if (username || password) {
    opts = { username, password };
  }

  const client = elasticsearch.createClient(opts);

  // mix in custom methods
  _.assign(client, methods);

  return client;
};

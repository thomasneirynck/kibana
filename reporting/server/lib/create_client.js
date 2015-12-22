var _ = require('lodash');

const methods = {
  authenticated: function () {
    return this.info()
    .then(
      () => { return true; },
      (err) => { return false; }
    );
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

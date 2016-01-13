const _ = require('lodash');
const Joi = require('joi');

const methods = {
  checkConnection: function () {
    return this.info()
    .catch(function (err) {
      throw new Error('Can not communicate with Elasticsearch');
    });
  }
};

module.exports = function createClient(elasticsearch, config = {}) {
  const { username, password } = config;
  const opts = (username || password) ? { username, password } : { auth: false };

  const client = elasticsearch.createClient(opts);

  // mix in custom methods
  _.assign(client, methods);

  return client;
};

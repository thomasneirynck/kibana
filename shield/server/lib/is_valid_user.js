const root = require('requirefrom')('');
const getAuthHeader = root('server/lib/get_auth_header');

module.exports = (server) => {
  const client = server.plugins.elasticsearch.client;

  return function isValidUser(username, password) {
    return client.info({
      headers: getAuthHeader(username, password)
    });
  }
};
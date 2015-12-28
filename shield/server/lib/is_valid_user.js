const root = require('requirefrom')('');
const basicAuth = root('server/lib/basic_auth');

module.exports = (server) => {
  const client = server.plugins.elasticsearch.client;

  return function isValidUser(username, password) {
    const authHeader = basicAuth.getHeader(username, password);

    return client.info({
      headers: authHeader
    });
  }
};
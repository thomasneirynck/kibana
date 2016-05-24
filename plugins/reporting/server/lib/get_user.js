const { get, noop } = require('lodash');

module.exports = (server, request) => {
  const getUser = get(server.plugins, 'security.getUser', noop);
  return Promise.resolve(getUser(request));
};
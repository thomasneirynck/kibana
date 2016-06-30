const { get, noop } = require('lodash');
const oncePerServer = require('./once_per_server');

module.exports = oncePerServer((server) => {
  return (request) => {
    const getUser = get(server.plugins, 'security.getUser', noop);
    return Promise.resolve(getUser(request));
  };
});

const { get, noop } = require('lodash');
const oncePerServer = require('./once_per_server');

function getUserFactory(server) {
  return (request) => {
    const getUser = get(server.plugins, 'security.getUser', noop);
    return Promise.resolve(getUser(request));
  };
}

module.exports = oncePerServer(getUserFactory);

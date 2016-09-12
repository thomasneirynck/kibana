const getUserFactory = require('./get_user');
const oncePerServer = require('./once_per_server');

function userPreRoutingFactory(server) {
  const getUser = getUserFactory(server);

  return function userPreRouting(request, reply) {
    reply(getUser(request));
  };
}

module.exports = oncePerServer(userPreRoutingFactory);


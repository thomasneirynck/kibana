const {assign} = require('lodash');
const root = require('requirefrom')('');
const basicAuth = root('server/lib/basic_auth');
const getClient = root('server/lib/get_client_shield');

module.exports = (server) => {
  const callWithRequest = getClient(server).callWithRequest;

  return function isValidUser(request, username, password) {
    assign(request.headers, basicAuth.getHeader(username, password));
    return callWithRequest(request, 'shield.authenticate');
  };
};
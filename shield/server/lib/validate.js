const _ = require('lodash');
const root = require('requirefrom')('');
const getAuthHeader = root('server/lib/get_auth_header');

module.exports = (server) => {
  const isValidUser = root('server/lib/is_valid_user')(server);

  return function validate(request, session, callback) {
    const {username, password} = session;

    return isValidUser(username, password).then(() => {
      _.assign(request.headers, getAuthHeader(username, password));
      return callback(null, true);
    }, (error) => {
      return callback(error, false);
    });
  };
};
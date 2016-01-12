const _ = require('lodash');
const root = require('requirefrom')('');
const basicAuth = root('server/lib/basic_auth');

module.exports = (server) => {
  const isValidUser = root('server/lib/is_valid_user')(server);

  return function validate(request, session, callback) {
    const {username, password} = session;

    return isValidUser(username, password).then(() => {
      _.assign(request.headers, basicAuth.getHeader(username, password));
      return callback(null, true);
    }, (error) => {
      return callback(error, false);
    });
  };
};
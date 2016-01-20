const root = require('requirefrom')('');

module.exports = (server) => {
  const isValidUser = root('server/lib/is_valid_user')(server);

  return function validate(request, session, callback) {
    const {username, password} = session;

    return isValidUser(request, username, password).then(
      () => callback(null, true),
      (error) => callback(error, false)
    );
  };
};
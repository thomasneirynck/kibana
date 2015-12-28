module.exports = {
  register: registerPreAuth,
  getHeader: getAuthHeader,
  parseHeader: parseAuthHeader,
};

function getAuthHeader(username, password) {
  const auth = new Buffer(`${username}:${password}`).toString('base64');
  return {
    authorization: `Basic ${auth}`
  };
};

function parseAuthHeader(authorization) {
  if (typeof authorization !== 'string')
    throw new Error('Authorization should be a string');

  const [ authType, token ] = authorization.split(' ');
  if (authType.toLowerCase() !== 'basic')
    throw new Error('Authorization is not Basic');

  // base64 decode auth header
  const tokenBuffer = new Buffer(token, 'base64');
  const tokenString = tokenBuffer.toString();

  // parse auth data
  let [ username, ...password ] = tokenString.split(/:/);
  password = password.join(':');

  return { username, password };
}

function registerPreAuth(server) {
  const isValidUser = require('./is_valid_user')(server);
  const config = server.config();

  server.ext('onPreAuth', function (request, reply) {
    // continue if already authenticated
    const existingAuth = request.state[config.get('shield.cookieName')];
    if (existingAuth) return reply.continue();

    try {
      // parse header for username and password
      const authorization = request.headers.authorization;
      const { username, password } = parseAuthHeader(authorization);

      // make sure the auth info is valid
      return isValidUser(username, password)
      .then(function () {
        // set cookie and replay the request
        request.auth.session.set({ username, password });
        return reply('reloading').redirect(request.url.href);
      }, () => reply.continue());
    } catch (err) {
      return reply.continue();
    }
  });
}

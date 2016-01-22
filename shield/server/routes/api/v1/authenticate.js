const Boom = require('boom');
const Joi = require('joi');
const root = require('requirefrom')('');

module.exports = (server) => {
  const isValidUser = root('server/lib/is_valid_user')(server);
  const success = {statusCode: 200, payload: 'success'};

  server.route({
    method: 'POST',
    path: '/api/shield/v1/login',
    handler(request, reply) {
      const {username, password} = request.payload;
      return isValidUser(request, username, password).then(() => {
        request.auth.session.set({username, password});
        return reply(success);
      }, (error) => {
        request.auth.session.clear();
        return reply(Boom.unauthorized(error));
      });
    },
    config: {
      auth: false,
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().required()
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/api/shield/v1/logout',
    handler(request, reply) {
      request.auth.session.clear();
      return reply(success);
    }
  });
};
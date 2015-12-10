const Boom = require('boom');
const Joi = require('joi');
const root = require('requirefrom')('');

module.exports = (server) => {
  const isValidUser = root('server/lib/is_valid_user')(server);

  server.route({
    method: 'POST',
    path: '/api/shield/v1/login',
    handler(request, reply) {
      return isValidUser(request.payload.username, request.payload.password).then(() => {
        request.auth.session.set({
          username: request.payload.username,
          password: request.payload.password
        });

        return reply({
          statusCode: 200,
          payload: 'success'
        });
      }, (error) => {
        request.auth.session.clear();
        return reply(Boom.unauthorized(error));
      })
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
};
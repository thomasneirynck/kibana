const Boom = require('boom');
const Joi = require('joi');
const root = require('requirefrom')('');

module.exports = (server) => {
  const isValidUser = root('server/lib/is_valid_user')(server);

  server.route({
    method: 'POST',
    path: '/api/shield/v1/login',
    handler(request, reply) {
      const {username, password} = request.payload;
      return isValidUser(username, password).then(() => {
        request.auth.session.set({
          username: username,
          password: password
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
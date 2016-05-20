import _ from 'lodash';
import Boom from 'boom';
import Joi from 'joi';
import getIsValidUser from '../../../lib/get_is_valid_user';
import getCalculateExpires from '../../../lib/get_calculate_expires';

export default (server, {commonRouteConfig, clientCookieName}) => {
  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);

  server.route({
    method: 'POST',
    path: '/api/security/v1/login',
    handler(request, reply) {
      const {username, password} = request.payload;
      return isValidUser(request, username, password).then((response) => {
        // Initialize the session
        request.auth.session.set({
          username,
          password,
          expires: calculateExpires()
        });

        return reply(response).state(clientCookieName, JSON.stringify(response));
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
      },
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/security/v1/logout',
    handler(request, reply) {
      request.auth.session.clear();
      return reply().unstate(clientCookieName).code(204);
    },
    config: {
      auth: false,
      ...commonRouteConfig
    }
  });
};

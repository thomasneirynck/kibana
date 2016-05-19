import _ from 'lodash';
import Boom from 'boom';
import Joi from 'joi';
import getIsValidUser from '../../../lib/get_is_valid_user';
import getCalculateExpires from '../../../lib/get_calculate_expires';
import getClient from '../../../lib/get_client_shield';
import { wrapError } from '../../../lib/errors';

export default (server, commonRouteConfig) => {
  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);
  const callWithRequest = getClient(server).callWithRequest;

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
        return reply(response);
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
      return reply().code(204);
    },
    config: {
      auth: false,
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/me',
    handler(request, reply) {
      return callWithRequest(request, 'shield.authenticate').then(reply, _.flow(wrapError, reply));
    },
    config: {
      ...commonRouteConfig
    }
  });
};

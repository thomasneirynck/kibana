import Boom from 'boom';
import Joi from 'joi';
import { wrapError } from '../../../lib/errors';
import { BasicCredentials } from '../../../../server/lib/authentication/providers/basic';

export function initAuthenticateApi(server) {
  server.route({
    method: 'POST',
    path: '/api/security/v1/login',
    async handler(request, reply) {
      const { username, password } = request.payload;

      try {
        const authenticationResult = await server.plugins.security.authenticate(
          BasicCredentials.decorateRequest(request, username, password)
        );

        if (!authenticationResult.succeeded()) {
          return reply(Boom.unauthorized(authenticationResult.error));
        }

        return reply.continue({ credentials: authenticationResult.user });
      } catch(err) {
        return reply(wrapError(err));
      }
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
    path: '/api/security/v1/logout',
    async handler(request, reply) {
      try {
        await server.plugins.security.deauthenticate(request);
      } catch(err) {
        return reply(wrapError(err));
      }

      return reply().code(204);
    },
    config: {
      auth: false,
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/me',
    handler(request, reply) {
      reply(request.auth.credentials);
    }
  });
}

import Boom from 'boom';
import Joi from 'joi';
import { get as resolve } from 'lodash';

import { indexNameSchema } from '../schemas';
import { ERR_CODES } from '../../../common/constants';


export function registerRoutes(server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');

  server.route({
    path: '/api/migration/assistance',
    method: 'GET',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: '/_xpack/migration/assistance',
          method: 'GET',
        });
        return reply(response.indices);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload.code = ERR_CODES.ERR_GET_ASSISTANCE_FAILED;

        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };

        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/upgrade/{indexName}',
    method: 'POST',
    config: {
      validate: {
        params: Joi.object({
          indexName: indexNameSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: '/_xpack/migration/upgrade',
          method: 'POST',
          query: {
            wait_for_completion: false,
          },
          body: {
            index: encodeURIComponent(request.params.indexName),
          },
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload.code = ERR_CODES.ERR_POST_UPGRADE_FAILED;
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/deprecations',
    method: 'GET',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: '/_xpack/migration/deprecations',
          method: 'GET',
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload.code = ERR_CODES.ERR_GET_DEPRECATIONS_FAILED;
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/deprecation_logging',
    method: 'GET',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'cluster.getSettings', {
          includeDefaults: true,
        });

        const isEnabled = isDeprecationLoggingEnabled(response);

        return reply({
          isEnabled,
        });

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload.code = ERR_CODES.ERR_GET_DEPR_LOGGING_FAILED;
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/deprecation_logging',
    method: 'PUT',
    config: {
      validate: {
        payload: Joi.object({
          isEnabled: Joi.boolean(),
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'cluster.putSettings', {
          body: {
            transient: {
              'logger.deprecation': request.payload.isEnabled ? 'WARN' : 'ERROR',
            },
          },
        });

        const isEnabled = isDeprecationLoggingEnabled(response);

        return reply({ isEnabled });

      } catch(requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload.code = ERR_CODES.ERR_PUT_DEPR_LOGGING_FAILED;
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });
}

function isDeprecationLoggingEnabled(settings) {
  const deprecationLogLevel = ['default', 'persistent', 'transient'].reduce(
    (currentLogLevel, settingsTier) => (
      resolve(settings, [settingsTier, 'logger', 'deprecation'], currentLogLevel)
    ),
    'WARN',
  );
  return ['TRACE', 'DEBUG', 'INFO', 'WARN'].includes(deprecationLogLevel);
}

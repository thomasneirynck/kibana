import Joi from 'joi';
import Boom from 'boom';
import { getErrors } from '../lib/errors/get_errors';
import { getErrorGroup } from '../lib/errors/get_error_group';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initErrorsApi(server) {
  server.route({
    path: '/api/apm/apps/{appName}/errors',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getErrors(req)
        .then(reply)
        .catch(err => {
          console.error(err);
          reply(Boom.wrap(err, 400));
        });
    }
  });

  server.route({
    path: '/api/apm/apps/{appName}/errors/{groupingId}',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getErrorGroup(req)
        .then(reply)
        .catch(err => {
          console.error(err);
          reply(Boom.wrap(err, 400));
        });
    }
  });
}

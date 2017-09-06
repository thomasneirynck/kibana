import Joi from 'joi';
import Boom from 'boom';

import { getDistribution } from '../lib/errors/distribution/get_distribution';
import { getErrors } from '../lib/errors/get_errors';
import { getErrorGroup } from '../lib/errors/get_error_group';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

const pre = [{ method: setupRequest, assign: 'setup' }];
const ROOT = '/api/apm/apps/{appName}/errors';
const defaultErrorHandler = reply => err => {
  console.error(err.stack);
  reply(Boom.wrap(err, 400));
};

export function initErrorsApi(server) {
  server.route({
    path: ROOT,
    config: {
      pre,
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
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/{groupId}`,
    config: {
      pre,
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
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/{groupId}/distribution`,
    config: {
      pre,
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getDistribution(req)
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });
}

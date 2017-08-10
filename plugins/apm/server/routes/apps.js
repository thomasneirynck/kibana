import Joi from 'joi';
import Boom from 'boom';
import { getApps } from '../lib/apps/get_apps';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initAppsApi(server) {
  server.route({
    path: '/api/apm/apps',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation,
          query: Joi.string().allow('')
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getApps(req).then(reply).catch(err => {
        server.log(['error'], err);
        reply(Boom.wrap(err, 400));
      });
    }
  });
}

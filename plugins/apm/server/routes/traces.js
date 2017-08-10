import Joi from 'joi';
import Boom from 'boom';
import getTraces from '../lib/traces/get_traces';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initTracesApi(server) {
  server.route({
    path: '/api/apm/apps/{appName}/metrics/traces',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation,
          transaction_id: Joi.string().required()
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getTraces(req).then(reply).catch(err => {
        console.error(err.stack);
        reply(Boom.wrap(err, 400));
      });
    }
  });
}

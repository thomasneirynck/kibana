import Joi from 'joi';
import Boom from 'boom';
import { getDistribution } from '../lib/distribution/get_distribution';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initDistributionApi(server) {
  server.route({
    path: '/api/apm/apps/{appName}/metrics/distribution',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation,
          transaction_name: Joi.string()
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getDistribution(req).then(reply).catch(err => {
        console.error(err.stack);
        reply(Boom.wrap(err, 400));
      });
    }
  });
}

import Joi from 'joi';
import Boom from 'boom';
import { getTimeseriesData } from '../lib/charts/get_timeseries_data';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initChartApi(server) {
  server.route({
    path: '/api/apm/apps/{appName}/transactions/charts',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation,
          transaction_type: Joi.string().default('request'),
          transaction_name: Joi.string(),
          query: Joi.string()
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getTimeseriesData(req)
        .then(reply)
        .catch(err => {
          console.error(err.stack);
          reply(Boom.wrap(err, 400));
        });
    }
  });
}

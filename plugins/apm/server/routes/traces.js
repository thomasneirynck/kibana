import Joi from 'joi';
import Boom from 'boom';
import getTraces from '../lib/traces/get_traces';
import { getTransactionDuration } from '../lib/transactions/get_transaction_duration';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initTracesApi(server) {
  server.route({
    path: '/api/apm/apps/{appName}/transactions/{transactionId}/traces',
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
      Promise.all([getTraces(req), getTransactionDuration(req)])
        .then(([traces, duration]) => reply({ ...traces, duration }))
        .catch(err => {
          console.error(err.stack);
          reply(Boom.wrap(err, 400));
        });
    }
  });
}

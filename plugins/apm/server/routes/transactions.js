import Joi from 'joi';
import Boom from 'boom';
import { getTopTransactions } from '../lib/transactions/get_top_transactions';
import getTransaction from '../lib/transactions/get_transaction';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

export function initTransactionsApi(server) {
  server.route({
    path: '/api/apm/apps/{appName}/transactions',
    config: {
      pre: [{ method: setupRequest, assign: 'setup' }],
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation,
          transaction_type: Joi.string().default('request'),
          query: Joi.string()
        })
      }
    },
    method: 'GET',
    handler: (req, reply) => {
      getTopTransactions(req)
        .then(reply)
        .catch(err => {
          console.error(err);
          reply(Boom.wrap(err, 400));
        });
    }
  });

  server.route({
    path: '/api/apm/apps/{appName}/transactions/{transactionId}',
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
      getTransaction(req)
        .then(reply)
        .catch(err => {
          console.error(err);
          reply(Boom.wrap(err, 400));
        });
    }
  });
}

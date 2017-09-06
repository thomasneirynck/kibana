import Joi from 'joi';
import Boom from 'boom';

import { getTimeseriesData } from '../lib/transactions/charts/get_timeseries_data';
import getTraces from '../lib/transactions/traces/get_traces';
import { getDistribution } from '../lib/transactions/distribution/get_distribution';
import { getTransactionDuration } from '../lib/transactions/get_transaction_duration';
import { getTopTransactions } from '../lib/transactions/get_top_transactions';
import getTransaction from '../lib/transactions/get_transaction';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

const pre = [{ method: setupRequest, assign: 'setup' }];
const ROOT = '/api/apm/apps/{appName}/transactions';
const defaultErrorHandler = reply => err => {
  console.error(err.stack);
  reply(Boom.wrap(err, 400));
};

export function initTransactionsApi(server) {
  server.route({
    path: ROOT,
    config: {
      pre,
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
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/{transactionId}`,
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
      getTransaction(req)
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/{transactionId}/traces`,
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
      Promise.all([getTraces(req), getTransactionDuration(req)])
        .then(([traces, duration]) => reply({ ...traces, duration }))
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/charts`,
    config: {
      pre,
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
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/distribution`,
    config: {
      pre,
      validate: {
        query: Joi.object().keys({
          start: dateValidation,
          end: dateValidation,
          transaction_name: Joi.string().required()
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

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
    method: 'GET',
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
    handler: (req, reply) => {
      const { appName } = req.params;
      const { transaction_type } = req.query;
      const { setup } = req.pre;

      return getTopTransactions({
        appName,
        transactionType: transaction_type,
        setup
      })
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    method: 'GET',
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
    handler: (req, reply) => {
      const { transactionId } = req.params;
      const { setup } = req.pre;
      return getTransaction({ transactionId, setup })
        .then(res => reply(res))
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    method: 'GET',
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
    handler: (req, reply) => {
      const { transactionId } = req.params;
      const { setup } = req.pre;
      return Promise.all([
        getTraces({ transactionId, setup }),
        getTransactionDuration({ transactionId, setup })
      ])
        .then(([traces, duration]) => reply({ ...traces, duration }))
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    method: 'GET',
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
    handler: (req, reply) => {
      const { setup } = req.pre;
      const { appName } = req.params;
      const transactionType = req.query.transaction_type;
      const transactionName = req.query.transaction_name;

      return getTimeseriesData({
        appName,
        transactionType,
        transactionName,
        setup
      })
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    method: 'GET',
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
    handler: (req, reply) => {
      const { setup } = req.pre;
      const { appName } = req.params;
      const { transaction_name: transactionName } = req.query;
      return getDistribution({
        appName,
        transactionName,
        setup
      })
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });
}

import Joi from 'joi';
import Boom from 'boom';
import { getApps } from '../lib/apps/get_apps';
import { getApp } from '../lib/apps/get_app';
import { setupRequest } from '../lib/helpers/setup_request';
import { dateValidation } from '../lib/helpers/date_validation';

const ROOT = '/api/apm/apps';
const pre = [{ method: setupRequest, assign: 'setup' }];
const defaultErrorHandler = reply => err => {
  console.error(err.stack);
  reply(Boom.wrap(err, 400));
};

export function initAppsApi(server) {
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
      getApps(req)
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });

  server.route({
    path: `${ROOT}/{appName}`,
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
      getApp(req)
        .then(reply)
        .catch(defaultErrorHandler(reply));
    }
  });
}

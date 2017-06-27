import Joi from 'joi';
import { getAllStats } from '../../../../lib/phone_home/get_all_stats';
import { receivePhoneHome } from '../../../../lib/phone_home/receive_phone_home';
import { handleError } from '../../../../lib/handle_error';

export function phoneHomeRoutes(server) {
  /**
   * This endpoint is ONLY for development and internal testing.
   */
  server.route({
    path: '/api/monitoring/v1/phone-home',
    method: 'POST',
    handler: (req, reply) => {
      const { callWithRequest } = server.plugins.elasticsearch.getCluster('monitoring');
      const callWith = (...args) => callWithRequest(req, ...args);

      // receivePhoneHome defaults to ignoring the payload
      return receivePhoneHome(callWith, req.payload.data)
      .then(reply)
      .catch (err => reply(handleError(err, req)));
    }
  });

  /**
   * Phone Home Data Gathering
   *
   * This provides a mechanism for fetching minor details about all clusters, including details related to the rest of the
   * stack (e.g., Kibana).
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/_stats',
    config: {
      validate: {
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;

      return getAllStats(req, start, end)
      .then(reply)
      .catch(() => {
        // ignore errors, return empty set and a 200
        reply([]).code(200);
      });
    }
  });
};

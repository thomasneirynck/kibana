import _ from 'lodash';
import Joi from 'joi';
import { getClustersFromRequest } from '../../../../lib/get_clusters_from_request';
import handleError from '../../../../lib/handle_error';

export default function clustersRoutes(server) {
  const config = server.config();
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('monitoring');

  /*
   * Monitoring Home
   * Route Init (for checking license and compatibility for multi-cluster monitoring
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters',
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
      return getClustersFromRequest(req)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

  /*
   * Phone Home Data Gathering
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters_stats',
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
      return getClustersFromRequest(req)
      .then(reply)
      .catch(() => {
        // ignore errors, return empty set and a 200
        reply([]).code(200);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/info',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        })
      }
    },
    handler: (req, reply) => {
      const params = {
        index: config.get('xpack.monitoring.index'),
        type: 'cluster_info',
        id: req.params.clusterUuid
      };
      return callWithRequest(req, 'get', params)
      .then(resp => {
        const fields = [
          'cluster_uuid',
          'timestamp',
          'cluster_name',
          'version',
          'license',
          'cluster_stats',
          'stack_stats'
        ];
        reply(_.pick(resp._source, fields));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });
};

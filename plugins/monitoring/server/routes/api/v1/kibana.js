import Joi from 'joi';
import Promise from 'bluebird';
import getKibanas from '../../../lib/get_kibanas';
import getKibanaInfo from '../../../lib/get_kibana_info';
import getClusterStatusKibana from '../../../lib/get_cluster_status_kibana';
import handleError from '../../../lib/handle_error';
const getMetrics = require('../../..//lib/get_metrics');
const calculateIndices = require('../../..//lib/calculate_indices');

module.exports = (server) => {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/kibana',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
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
      const index = req.server.config().get('xpack.monitoring.kibana_prefix') + '*';
      return calculateIndices(req, start, end, index)
      .then(kibanaIndices => {
        return Promise.props({
          kibanas: getKibanas(req, kibanaIndices),
          clusterStatus: getClusterStatusKibana(req, kibanaIndices)
        });
      })
      .then (kibanas => reply(kibanas))
      .catch(err => reply(handleError(err, req)));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/kibana/{kibanaUuid}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          kibanaUuid: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      const kbnIndexPattern = req.server.config().get('xpack.monitoring.kibana_prefix') + '*';
      return calculateIndices(req, start, end, kbnIndexPattern)
      .then(kibanaIndices => {
        return Promise.props({
          metrics: getMetrics(req, kibanaIndices),
          clusterStatus: getClusterStatusKibana(req, kibanaIndices),
          kibanaSummary: getKibanaInfo(req, req.params.kibanaUuid)
        });
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};

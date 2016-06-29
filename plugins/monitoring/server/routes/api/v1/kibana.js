import Joi from 'joi';
import Promise from 'bluebird';
import _ from 'lodash';
import getKibanas from '../../../lib/get_kibanas';
import getKibanaInfo from '../../../lib/get_kibana_info';
import getKibanasForClusters from '../../../lib/get_kibanas_for_clusters';
import handleError from '../../../lib/handle_error';
const getMetrics = require('../../..//lib/get_metrics');
const calculateIndices = require('../../..//lib/calculate_indices');

const getClusterStatus = function (req, kibanaIndices, calledFrom) {
  const getKibanaForCluster = getKibanasForClusters(req, kibanaIndices, calledFrom);
  return getKibanaForCluster([{ cluster_uuid: req.params.clusterUuid }])
  .then(clusterStatus => _.get(clusterStatus, '[0].stats'));
};

/*
 * Kibana listing
 */
module.exports = (server) => {
  const config = server.config();
  const kbnIndexPattern = config.get('xpack.monitoring.kibana.index_pattern');
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
      return calculateIndices(req, start, end, kbnIndexPattern)
      .then(kibanaIndices => {
        return Promise.props({
          kibanas: getKibanas(req, kibanaIndices),
          clusterStatus: getClusterStatus(req, kibanaIndices, 'route-kibana-listing')
        });
      })
      .then (result => {
        const data = {
          kibanas: result.kibanas.map(k => {
            return {
              kibana: _.pick(k.kibana, [
                'uuid', 'name', 'host', 'transport_address', 'version', 'status'
              ]),
              ..._.pick(k, [
                'os', 'process', 'requests', 'response_times', 'concurrent_connections', 'availability'
              ])
            };
          }),
          clusterStatus: result.clusterStatus
        };

        return reply(data);
      })
      .catch(err => reply(handleError(err, req)));
    }
  });

/*
 * Kibana instance
 */
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
      return calculateIndices(req, start, end, kbnIndexPattern)
      .then(kibanaIndices => {
        return Promise.props({
          metrics: getMetrics(req, kibanaIndices),
          clusterStatus: getClusterStatus(req, kibanaIndices, 'route-kibana-instance'),
          kibanaSummary: getKibanaInfo(req, req.params.kibanaUuid)
        });
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};

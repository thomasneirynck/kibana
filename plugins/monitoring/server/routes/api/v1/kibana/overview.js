import Joi from 'joi';
import { get } from 'lodash';
import { getKibanasForClusters } from '../../../../lib/kibana/get_kibanas_for_clusters';
import { handleError } from '../../../../lib/errors';
import { getMetrics } from '../../../../lib/details/get_metrics';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

const getKibanaClusterStatus = function (req, kbnIndexPattern, { clusterUuid }) {
  const clusters = [{ cluster_uuid: clusterUuid }];
  return getKibanasForClusters(req, kbnIndexPattern, clusters)
    .then(kibanas => get(kibanas, '[0].stats'));
};

export function kibanaInstancesRoutes(server) {
  /**
   * Kibana overview (metrics)
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/kibana',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional(),
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    async handler(req, reply) {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const kbnIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.kibana.index_pattern', ccs);
      const metricSet = req.payload.metrics;

      try {
        const [ clusterStatus, metrics ] = await Promise.all([
          getKibanaClusterStatus(req, kbnIndexPattern, { clusterUuid }),
          getMetrics(req, kbnIndexPattern, metricSet),
        ]);

        reply({
          clusterStatus,
          metrics,
        });
      } catch(err) {
        reply(handleError(err, req));
      }
    }
  });
}

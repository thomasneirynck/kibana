import Joi from 'joi';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';
import { getKibanaClusterStatus } from './_get_kibana_cluster_status';
import { handleError } from '../../../../lib/errors';
import { getMetrics } from '../../../../lib/details/get_metrics';

export function kibanaOverviewRoute(server) {
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

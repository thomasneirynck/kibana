import moment from 'moment';
import Joi from 'joi';
import { getClusterStatus } from '../../../../../lib/logstash/get_cluster_status';
import { getPipelines } from '../../../../../lib/logstash/get_pipelines';
import { handleError } from '../../../../../lib/handle_error';

/**
 * Retrieve pipelines for a cluster
 */
export function logstashClusterPipelinesRoute(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/logstash/pipelines',
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
    handler: async (req, reply) => {
      const config = server.config();
      const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');

      const start = moment(req.payload.timeRange.min).valueOf();
      const end = moment(req.payload.timeRange.max).valueOf();
      const clusterUuid = req.params.clusterUuid;

      try {
        const response = {
          pipelines: await getPipelines(req, config, logstashIndexPattern, start, end, clusterUuid),
          clusterStatus: await getClusterStatus(req, logstashIndexPattern)
        };
        reply(response);
      } catch (err) {
        reply(handleError(err, req));
      }
    }
  });
}

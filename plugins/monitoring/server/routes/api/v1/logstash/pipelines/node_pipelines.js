import moment from 'moment';
import Joi from 'joi';
import { getNodeInfo } from '../../../../../lib/logstash/get_node_info';
import { getPipelines } from '../../../../../lib/logstash/get_pipelines';
import { handleError } from '../../../../../lib/handle_error';

/**
 * Retrieve pipelines for a node
 */
export function logstashNodePipelinesRoute(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/logstash/node/{logstashUuid}/pipelines',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          logstashUuid: Joi.string().required()
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
      const logstashUuid = req.params.logstashUuid;

      try {
        const response = {
          pipelines: await getPipelines(req, config, logstashIndexPattern, start, end, clusterUuid, logstashUuid),
          nodeSummary: await getNodeInfo(req, req.params.logstashUuid)
        };
        reply(response);
      } catch (err) {
        reply(handleError(err, req));
      }
    }
  });
}

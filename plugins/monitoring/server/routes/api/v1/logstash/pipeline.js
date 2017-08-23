import Joi from 'joi';
import { handleError } from '../../../../lib/handle_error';
import { getPipeline } from '../../../../lib/logstash/get_pipeline';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

/*
 * Logstash Pipeline route.
 */
export function logstashPipelineRoute(server) {
  /**
   * Logtash Pipeline Viewer request.
   *
   * This will fetch all data required to display a Logstash Pipeline Viewer page.
   *
   * The current details returned are:
   *
   * - Pipeline Metrics
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/logstash/pipeline/{pipelineId}/{pipelineHash}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          pipelineId: Joi.string().required(),
          pipelineHash: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional(),
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const lsIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.logstash.index_pattern', ccs);

      const pipelineId = req.params.pipelineId;
      const pipelineHash = req.params.pipelineHash;
      const timeRange = req.payload.timeRange;

      return getPipeline(req, lsIndexPattern, clusterUuid, pipelineId, pipelineHash, timeRange)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
}

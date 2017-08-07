import Joi from 'joi';
import Promise from 'bluebird';
import { get } from 'lodash';
import { getKibanas } from '../../../../lib/kibana/get_kibanas';
import { getKibanasForClusters } from '../../../../lib/kibana/get_kibanas_for_clusters';
import { handleError } from '../../../../lib/handle_error';
import { getMetrics } from '../../../../lib/details/get_metrics';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

const getKibanaClusterStatus = function (req, kbnIndexPattern, { clusterUuid }) {
  const clusters = [{ cluster_uuid: clusterUuid }];
  return getKibanasForClusters(req, kbnIndexPattern, clusters)
  .then(kibanas => get(kibanas, '[0].stats'));
};

/*
 * Kibana routes
 */
export function kibanaInstancesRoutes(server) {
  /**
   * Kibana overview and listing
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
          metrics: Joi.array().optional(),
          instances: Joi.boolean().default(true)
        })
      }
    },
    handler: (req, reply) => {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const kbnIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.kibana.index_pattern', ccs);

      return Promise.props({
        metrics: req.payload.metrics ? getMetrics(req, kbnIndexPattern) : {},
        kibanas: req.payload.instances ? getKibanas(req, kbnIndexPattern, { clusterUuid }) : [],
        clusterStatus: getKibanaClusterStatus(req, kbnIndexPattern, { clusterUuid })
      })
      .then (reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};

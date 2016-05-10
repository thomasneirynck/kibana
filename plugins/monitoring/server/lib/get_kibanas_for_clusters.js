import Promise from 'bluebird';
import _ from 'lodash';
const createQuery = require('./create_query.js');
export default function getKibanasForClusters(req, indices) {
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  return function (clusters) {
    return Promise.map(clusters, cluster => {
      const options = {
        index: indices,
        meta: 'get_kibanas_for_cluster',
        ignore: [404],
        type: 'kibana_stats',
        body: {
          query: createQuery({ start, end, clusterUuid: cluster.cluster_uuid }),
          aggs: {
            kibana_uuids: { terms: { field: 'kibana_stats.kibana.uuid' } }
          },
          size: 0
        }
      };
      return callWithRequest(req, 'search', options)
      .then(result => {
        cluster.kibana = {
          count: _.get(result, 'aggregations.kibana_uuids.buckets.length')
        };
        return cluster;
      });
    });
  };
};

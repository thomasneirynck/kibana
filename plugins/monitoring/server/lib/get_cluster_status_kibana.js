import Promise from 'bluebird';
import _ from 'lodash';
import moment from 'moment';
import calculateClusterHealthKibana from './calculate_cluster_health_kibana';
const nodeAggVals = require('./node_agg_vals');
const createQuery = require('./create_query.js');

export default function getClusterStatusKibana(req, indices) {
  if (indices[0] === '.kibana-devnull') return Promise.resolve([]);

  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const clusterUuid = req.params.clusterUuid;

  const params = {
    index: indices,
    type: 'kibana_stats',
    meta: 'get_cluster_status_kibana',
    ignore: [404],
    body: {
      size: 0,
      query: createQuery({ start, end, clusterUuid }),
      aggs: {
        kibana_cluster: {
          terms: { field: 'kibana_stats.kibana.uuid' },
          aggs: {
            status: {
              terms: { field: 'kibana_stats.kibana.status', size: 1000 },
              aggs: { max_timestamp: { max: { field: 'timestamp' } } }
            }
          }
        }
      }
    }
  };

  return callWithRequest(req, 'search', params)
  .then(resp => {
    const buckets = _.get(resp, 'aggregations.kibana_cluster.buckets');
    const status = calculateClusterHealthKibana(
      buckets.map(instance => {
        // for every instance, get the status with the greatest time stamp
        return nodeAggVals.getLatestAggKey(instance.status.buckets);
      })
    );

    return {
      status,
      kibanasCount: buckets.length,
      kibanaCount: _.get(resp, 'aggregations.kibana_cluster.buckets.length')
    };
  });
};

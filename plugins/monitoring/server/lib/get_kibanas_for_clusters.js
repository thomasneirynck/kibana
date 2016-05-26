/*
 * Get high-level info for Kibanas in a set of clusters
 * The set contains multiple clusters for cluster listing page
 * The set contains single cluster for cluster overview page and cluster status bar
 * Returns, for each cluster,
 *  - number of instances
 *  - combined health
 */
import Promise from 'bluebird';
import _ from 'lodash';
import moment from 'moment';
import numeral from '@spalger/numeral';
import calculateOverallStatus from './calculate_overall_status';
const nodeAggVals = require('./node_agg_vals');
const createQuery = require('./create_query.js');
export default function getKibanasForClusters(req, indices, calledFrom) {
  if (indices[0] === '.kibana-devnull') return Promise.resolve([]);

  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  return function (clusters) {
    return Promise.map(clusters, cluster => {
      const clusterUuid = cluster.cluster_uuid;
      const options = {
        size: 0,
        index: indices,
        meta: `get_kibanas_for_cluster-${calledFrom}`,
        ignoreUnavailable: true,
        type: 'kibana_stats',
        body: {
          query: createQuery({ start, end, clusterUuid }),
          aggs: {
            kibana_cluster: {
              terms: {
                field: 'kibana_stats.kibana.uuid'
              },
              aggs: {
                status: {
                  terms: {
                    field: 'kibana_stats.kibana.status'
                  },
                  aggs: {
                    max_timestamp: {
                      max: {
                        field: 'timestamp'
                      }
                    }
                  }
                },
                concurrent_connections: {
                  avg: {
                    field: 'kibana_stats.concurrent_connections'
                  }
                },
                requests: {
                  avg: {
                    field: 'kibana_stats.requests.total'
                  }
                }
              }
            }
          }
        }
      };
      return callWithRequest(req, 'search', options)
      .then(result => {
        const buckets = _.get(result, 'aggregations.kibana_cluster.buckets');
        let status;
        let requests;
        let connections;
        if (buckets.length) {
          // if the cluster has kibana instances at all
          status = calculateOverallStatus(
            buckets.map(instance => {
              if (instance.status.buckets.length > 1) {
                // get the status with the greatest time stamp, this gets the "most recent" status
                return nodeAggVals.getLatestAggKey(instance.status.buckets);
              }
              return instance.status.buckets[0].key;
            })
          );
          requests = _.last(_.map(buckets, (instance) => instance.requests.value));
          connections = _.last(_.map(buckets, (instance) => instance.concurrent_connections.value));
        }

        return {
          clusterUuid,
          stats: {
            status,
            requests: numeral(requests).format('0.00'),
            connections: numeral(connections).format('0.00'),
            count: buckets.length
          }
        };
      });
    });
  };
};

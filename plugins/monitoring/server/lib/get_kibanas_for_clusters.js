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
const calcAuto = require('./calculate_auto');
const createQuery = require('./create_query.js');
export default function getKibanasForClusters(req, indices, calledFrom) {
  if (indices[0] === '.kibana-devnull') return Promise.resolve([]);


  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();

  const config = req.server.config();
  const minIntervalSeconds = config.get('xpack.monitoring.min_interval_seconds');
  const duration = moment.duration(end - start, 'ms');
  const bucketSize = Math.max(minIntervalSeconds, calcAuto.near(100, duration).asSeconds());
  const lastBucketStart = moment(end).subtract(bucketSize, 'seconds').valueOf();
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
          query: createQuery({ start: lastBucketStart, end, clusterUuid }),
          aggs: {
            concurrent_connections: {
              avg: {
                field: 'kibana_stats.concurrent_connections'
              }
            },
            requests: {
              avg: {
                field: 'kibana_stats.requests.total'
              }
            },
            kibana_uuids: {
              terms: {
                field: 'kibana_stats.kibana.uuid'
              }
            },
            status: {
              terms: {
                field: 'kibana_stats.kibana.status',
                order: {
                  max_timestamp: 'desc'
                },
                size: 1
              },
              aggs: {
                max_timestamp: {
                  max: {
                    field: 'timestamp'
                  }
                }
              }
            }
          }
        }
      };
      return callWithRequest(req, 'search', options)
      .then(result => {
        const kibanaUuids =  _.get(result, 'aggregations.kibana_uuids.buckets');
        const statusBuckets = _.get(result, 'aggregations.status.buckets');
        let status;
        let requests;
        let connections;
        if (kibanaUuids.length) {
          // if the cluster has kibana instances at all
          status = calculateOverallStatus(
            statusBuckets.map(b => b.key)
          );
          requests = _.get(result, 'aggregations.requests.value');
          connections = _.get(result, 'aggregations.concurrent_connections.value');
        }

        return {
          clusterUuid,
          stats: {
            status,
            requests: numeral(requests).format('0.00'),
            connections: numeral(connections).format('0.00'),
            count: kibanaUuids.length
          }
        };
      });
    });
  };
};

/*
 * Get high-level info for Logstashs in a set of clusters
 * The set contains multiple clusters for cluster listing page
 * The set contains single cluster for cluster overview page and cluster status bar

 * Timespan for the data is an interval of time based on calculations of an
 * interval size using the same calculation as determining bucketSize using
 * the timepicker for a chart

 * Returns, for each cluster,
 *  - number of instances
 *  - combined health
 */
import Promise from 'bluebird';
import _ from 'lodash';
import createQuery from './../create_query.js';
import { ElasticsearchMetric } from './../metrics/metric_classes';

export default function getLogstashForClusters(req, indices) {
  if (indices.length < 1) return () => Promise.resolve([]);

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;

  return function (clusters) {
    return Promise.map(clusters, cluster => {
      const clusterUuid = cluster.cluster_uuid;
      const metric = ElasticsearchMetric.getMetricFields();
      const params = {
        size: 0,
        index: indices,
        ignoreUnavailable: true,
        type: 'logstash_stats',
        body: {
          query: createQuery({
            start,
            end,
            uuid: clusterUuid,
            metric
          }),
          aggs: {
            avg_memory_used: {
              avg: {
                field: 'logstash_stats.jvm.mem.heap_used_in_bytes'
              }
            },
            avg_memory: {
              avg: {
                field: 'logstash_stats.jvm.mem.heap_max_in_bytes'
              }
            },
            avg_cpu_usage: {
              avg: {
                field: 'logstash_stats.process.cpu.percent'
              }
            },
            logstash_uuids: {
              terms: {
                field: 'logstash_stats.logstash.uuid'
              },
              aggs: {
                events_in_total_per_node: {
                  max: {
                    field: 'logstash_stats.events.in'
                  }
                },
                events_out_total_per_node: {
                  max: {
                    field: 'logstash_stats.events.out'
                  }
                }
              }
            },
            events_in_total: {
              sum_bucket: {
                buckets_path: 'logstash_uuids>events_in_total_per_node'
              }
            },
            events_out_total: {
              sum_bucket: {
                buckets_path: 'logstash_uuids>events_out_total_per_node'
              }
            },
            max_uptime: {
              max: {
                field: 'logstash_stats.jvm.uptime_in_millis'
              }
            }
          }
        }
      };
      return callWithRequest(req, 'search', params)
      .then(result => {
        const getResultAgg = key => _.get(result, `aggregations.${key}`);
        const logstashUuids =  getResultAgg('logstash_uuids.buckets');

        // everything is initialized such that it won't impact any rollup
        let eventsInTotal = 0;
        let eventsOutTotal = 0;
        let avgMemory = 0;
        let avgMemoryUsed = 0;
        let maxUptime = 0;
        let avgCpuUsage = 0;

        // if the cluster has logstash instances at all
        if (logstashUuids.length) {
          eventsInTotal = getResultAgg('events_in_total.value');
          eventsOutTotal = getResultAgg('events_out_total.value');
          avgMemory = getResultAgg('avg_memory.value');
          avgMemoryUsed = getResultAgg('avg_memory_used.value');
          maxUptime = getResultAgg('max_uptime.value');
          avgCpuUsage = getResultAgg('avg_cpu_usage.value');
        }

        return {
          clusterUuid,
          stats: {
            count: logstashUuids.length,
            events_in_total: eventsInTotal,
            events_out_total: eventsOutTotal,
            avg_memory: avgMemory,
            avg_memory_used: avgMemoryUsed,
            max_uptime: maxUptime,
            avg_cpu_usage: avgCpuUsage
          }
        };
      });
    });
  };
};

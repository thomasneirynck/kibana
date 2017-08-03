import { get } from 'lodash';
import { checkParam } from '../error_missing_required';
import { createQuery } from '../create_query';
import { LogstashClusterMetric } from '../metrics/metric_classes';

function fetchPipelines(req, config, logstashIndexPattern, start, end, clusterUuid, logstashUuid) {
  const filters = [];
  if (logstashUuid) {
    filters.push({ term: { 'logstash_stats.logstash.uuid': logstashUuid } });
  }

  const metric = LogstashClusterMetric.getMetricFields();
  const params = {
    index: logstashIndexPattern,
    ignoreUnavailable: true,
    filterPath: [
      'aggregations.pipelines.by_pipeline_id.buckets.key',
      'aggregations.pipelines.by_pipeline_id.buckets.by_pipeline_hash.buckets.key',
      'aggregations.pipelines.by_pipeline_id.buckets.by_pipeline_hash.buckets.throughput.value',
      'aggregations.pipelines.by_pipeline_id.buckets.by_pipeline_hash.buckets.duration_in_millis.value',
      'aggregations.pipelines.by_pipeline_id.buckets.by_pipeline_hash.buckets.path_to_root.last_seen.value'
    ],
    body: {
      size: 0,
      query: createQuery({
        type: 'logstash_stats',
        start,
        end,
        uuid: clusterUuid,
        metric,
        filters
      }),
      aggs: {
        pipelines: {
          nested: {
            path: 'logstash_stats.pipelines'
          },
          aggs: {
            by_pipeline_id: {
              terms: {
                field: 'logstash_stats.pipelines.id',
                size: config.get('xpack.monitoring.max_bucket_size')
              },
              aggs: {
                by_pipeline_hash: {
                  terms: {
                    field: 'logstash_stats.pipelines.hash',
                    size: config.get('xpack.monitoring.max_bucket_size'),
                    order: { 'path_to_root>last_seen': 'desc' }
                  },
                  aggs: {
                    path_to_root: {
                      reverse_nested: {},
                      aggs: {
                        last_seen: {
                          max: {
                            field: 'logstash_stats.timestamp'
                          }
                        }
                      }
                    },
                    throughput: {
                      sum_bucket: {
                        buckets_path: 'by_ephemeral_id>throughput'
                      }
                    },
                    duration_in_millis: {
                      sum_bucket: {
                        buckets_path: "by_ephemeral_id>duration_in_millis"
                      }
                    },
                    by_ephemeral_id: {
                      terms: {
                        field: 'logstash_stats.pipelines.ephemeral_id',
                        size: config.get('xpack.monitoring.max_bucket_size')
                      },
                      aggs: {
                        events_stats: {
                          stats: {
                            field: 'logstash_stats.pipelines.events.out'
                          }
                        },
                        throughput: {
                          bucket_script: {
                            script: 'params.max - params.min',
                            buckets_path: {
                              min: 'events_stats.min',
                              max: 'events_stats.max'
                            }
                          }
                        },
                        duration_stats: {
                          stats: {
                            field: "logstash_stats.pipelines.events.duration_in_millis"
                          }
                        },
                        duration_in_millis: {
                          bucket_script: {
                            script: "params.max - params.min",
                            buckets_path: {
                              min: "duration_stats.min",
                              max: "duration_stats.max"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params);
}

export function _handleResponse(response, timespanInSeconds) {
  const pipelinesById = get(response, 'aggregations.pipelines.by_pipeline_id.buckets', []);
  const pipelines = pipelinesById.map(pipelineById => {
    const id = pipelineById.key;
    const pipeline = {
      id
    };

    const pipelinesByHash = get(pipelineById, 'by_pipeline_hash.buckets', []);
    pipeline.hashes = pipelinesByHash.map(pipelineByHash => {
      const hash = pipelineByHash.key;

      const throughput = get(pipelineByHash, 'throughput.value', null);
      const durationInMillis = get(pipelineByHash, 'duration_in_millis.value', null);
      const eventsPerSecond = throughput ? throughput / timespanInSeconds : null;
      const eventLatencyInMs = throughput && durationInMillis ? durationInMillis / throughput : null;
      const lastSeen = get(pipelineByHash, 'path_to_root.last_seen.value');

      return {
        hash,
        eventsPerSecond,
        eventLatencyInMs,
        lastSeen
      };
    });

    return pipeline;
  });

  return pipelines;
}

export async function getPipelines(req, config, logstashIndexPattern, start, end, clusterUuid, logstashUuid) {
  checkParam(logstashIndexPattern, 'logstashIndexPattern in getPipelines');

  const timespanInSeconds = (end - start) / 1000;
  const response = await fetchPipelines(req, config, logstashIndexPattern, start, end, clusterUuid, logstashUuid);
  return _handleResponse(response, timespanInSeconds);
};

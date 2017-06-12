import { get, merge } from 'lodash';
import { calculateAvailability } from './../calculate_availability';

export function handleResponse(resp) {
  const source = get(resp, 'hits.hits[0]._source.logstash_stats');
  const logstash = get(source, 'logstash');
  const info = merge(
    logstash,
    {
      availability: calculateAvailability(get(source, 'timestamp')),
      events: get(source, 'events'),
      reloads: get(source, 'reloads'),
      queue_type: get(source, 'queue.type'),
      uptime: get(source, 'jvm.uptime_in_millis')
    }
  );
  return info;
}

export function getNodeInfo(req, uuid) {
  const config = req.server.config();
  const params = {
    index: config.get('xpack.monitoring.logstash.index_pattern'),
    ignore: [404],
    filterPath: [
      'hits.hits._source.logstash_stats.events',
      'hits.hits._source.logstash_stats.jvm.uptime_in_millis',
      'hits.hits._source.logstash_stats.logstash',
      'hits.hits._source.logstash_stats.queue.type',
      'hits.hits._source.logstash_stats.reloads',
      'hits.hits._source.logstash_stats.timestamp'
    ],
    body: {
      size: 1,
      query: {
        term: {
          'logstash_stats.logstash.uuid': uuid
        }
      },
      collapse: { field: 'logstash_stats.logstash.uuid' },
      sort: [
        { timestamp: { order: 'desc' } }
      ]
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(handleResponse);
}

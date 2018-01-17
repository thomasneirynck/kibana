import { capitalize, get } from 'lodash';
import { checkParam } from '../error_missing_required';
import { createQuery } from '../create_query.js';
import { BeatsMetric } from '../metrics';

export function handleResponse(response, beatUuid) {
  const stats = get(response, 'hits.hits[0]._source.beats_stats');
  return {
    uuid: beatUuid,
    transportAddress: get(stats, 'beat.host'),
    version: get(stats, 'beat.version'),
    name: get(stats, 'beat.name'),
    type: capitalize(get(stats, 'beat.type')),
    output: capitalize(get(stats, 'metrics.libbeat.output.type')),
    eventsPublished: get(stats, 'metrics.libbeat.pipeline.events.published'),
    eventsEmitted: get(stats, 'metrics.libbeat.pipeline.events.total'), // TODO: confirm this is the correct field
    eventsDropped: get(stats, 'metrics.libbeat.pipeline.events.dropped'),
    bytesWritten: get(stats, 'metrics.libbeat.output.write.bytes'),
    configReloads: get(stats, 'metrics.libbeat.config.reloads'),
    uptime: get(stats, [ 'metrics', 'beat', 'info', 'uptime.ms' ]), // NOTE: The uptime fieldname has a dot in it
  };
}

export async function getBeatSummary(req, beatsIndexPattern, { clusterUuid, beatUuid, start, end }) {
  checkParam(beatsIndexPattern, 'beatsIndexPattern in beats/getBeatSummary');

  const metric = BeatsMetric.getMetricFields();
  const filters = [
    { term: { 'beats_stats.beat.uuid': beatUuid } }
  ];
  const params = {
    index: beatsIndexPattern,
    ignore: [404],
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({ type: 'beats_stats', start, end, uuid: clusterUuid, metric, filters })
    },
    _source: [
      'beats_stats.beat.host',
      'beats_stats.beat.version',
      'beats_stats.beat.name',
      'beats_stats.beat.type',
      'beats_stats.metrics.libbeat.output.type',
      'beats_stats.metrics.libbeat.pipeline.events.published',
      'beats_stats.metrics.libbeat.pipeline.events.total',
      'beats_stats.metrics.libbeat.pipeline.events.dropped',
      'beats_stats.metrics.libbeat.output.write.bytes',
      'beats_stats.metrics.libbeat.config.reloads',
      'beats_stats.metrics.beat.info.uptime.ms'
    ]
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const response = await callWithRequest(req, 'search', params);
  return handleResponse(response, beatUuid);
}

import boom from 'boom';
import { get } from 'lodash';
import { getPipelineStateDocument } from './get_pipeline_state_document';
import { getPipelineStatsAggregation } from './get_pipeline_stats_aggregation';

export function _vertexStats(vertex, vertexStatsBucket, totalProcessorsDurationInMillis, timePickerDurationMillis) {

  const isInput = vertex.plugin_type === 'input';
  const isProcessor = vertex.plugin_type === 'filter' || vertex.plugin_type === 'output';

  const eventsInTotal = vertexStatsBucket.events_in_total.value;
  const eventsOutTotal = get(vertexStatsBucket, 'events_out_total.value', null);
  const eventsTotal = eventsOutTotal || eventsInTotal;

  const durationInMillis = vertexStatsBucket.duration_in_millis_total.value;

  const inputStats = {};
  const processorStats = {};

  if (isInput) {
    inputStats.queue_push_duration_in_millis = vertexStatsBucket.queue_push_duration_in_millis_total.value;
    inputStats.queue_push_duration_in_millis_per_event = inputStats.queue_push_duration_in_millis / eventsTotal;
  }

  if (isProcessor) {
    processorStats.percent_of_total_processor_duration = durationInMillis / totalProcessorsDurationInMillis;
  }

  return {
    events_in: eventsInTotal,
    events_out: eventsOutTotal,
    duration_in_millis: durationInMillis,
    events_per_millisecond: eventsTotal / timePickerDurationMillis,
    millis_per_event: durationInMillis / eventsTotal,
    ...inputStats,
    ...processorStats
  };
}

export function _enrichStateWithStatsAggregation(stateDocument, statsAggregation, timePickerDurationMillis) {
  const vertexStatsByIdBuckets = statsAggregation.aggregations.pipelines.scoped.vertices.vertex_id.buckets;
  const logstashState = stateDocument.logstash_state;
  const vertices = logstashState.pipeline.representation.graph.vertices;

  const rootAgg = statsAggregation.aggregations;
  const scopedAgg = rootAgg.pipelines.scoped;

  const durationStats = scopedAgg.events_duration;
  const totalProcessorsDurationInMillis = durationStats.max - durationStats.min;
  durationStats.duration = totalProcessorsDurationInMillis;

  logstashState.nodes_count = rootAgg.nodes_count.value;
  logstashState.events_in = rootAgg.in_total.value;
  logstashState.events_out = rootAgg.out_total.value;

  const verticesById = {};
  vertices.forEach(vertex => {
    verticesById[vertex.id] = vertex;
  });

  vertexStatsByIdBuckets.forEach(vertexStatsBucket => {
    const id = vertexStatsBucket.key;
    const vertex = verticesById[id];

    if (vertex !== undefined) {
      vertex.stats = _vertexStats(vertex, vertexStatsBucket, totalProcessorsDurationInMillis, timePickerDurationMillis);
    }
  });

  return stateDocument.logstash_state;
}

export async function getPipeline(req, clusterUuid, pipelineId, pipelineHash, timeRange) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();
  const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');

  const start = timeRange.min;
  const end = timeRange.max;
  const timePickerDurationMillis = end - start;

  const [ stateDocument, statsAggregation ] = await Promise.all([
    getPipelineStateDocument(callWithRequest, req, logstashIndexPattern, pipelineId, pipelineHash),
    getPipelineStatsAggregation(callWithRequest, req, logstashIndexPattern, start, end, pipelineId, pipelineHash)
  ]);

  if (stateDocument === null) {
    return boom.notFound(`Pipeline [${pipelineId} @ ${pipelineHash}] not found in the selected time range for cluster [${clusterUuid}].`);
  }

  const result = _enrichStateWithStatsAggregation(stateDocument, statsAggregation, timePickerDurationMillis);
  return result;
}

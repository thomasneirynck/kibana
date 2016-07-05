function indexingLatencyAggs(fieldSource) {
  return {
    index_time_in_millis: {
      max: { field: `${fieldSource}.indexing.index_time_in_millis` }
    },
    index_total: {
      max: { field: `${fieldSource}.indexing.index_total` }
    },
    index_time_in_millis_deriv: {
      derivative: { buckets_path: 'index_time_in_millis', gap_policy: 'skip' }
    },
    index_total_deriv: {
      derivative: { buckets_path: 'index_total', gap_policy: 'skip' }
    }
  };
}

function queryLatencyAggs(fieldSource) {
  return {
    query_time_in_millis: {
      max: { field: `${fieldSource}.search.query_time_in_millis` }
    },
    query_total: {
      max: { field: `${fieldSource}.search.query_total` }
    },
    query_time_in_millis_deriv: {
      derivative: { buckets_path: 'query_time_in_millis', gap_policy: 'skip' }
    },
    query_total_deriv: {
      derivative: { buckets_path: 'query_total', gap_policy: 'skip' }
    }
  };
}

function indexingLatencyCalculation(last) {
  var required = last &&
      last.index_time_in_millis_deriv &&
      last.index_total_deriv &&
      last.index_total_deriv.value &&
      last.index_time_in_millis_deriv.value;
  if (required) {
    return last.index_time_in_millis_deriv.value / last.index_total_deriv.value;
  }

  return 0;
}

function queryLatencyCalculation(last) {
  var required = last &&
      last.query_time_in_millis_deriv &&
      last.query_total_deriv &&
      last.query_total_deriv.value &&
      last.query_time_in_millis_deriv.value;
  if (required) {
    return last.query_time_in_millis_deriv.value / last.query_total_deriv.value;
  }

  return 0;
}

const formatLargeFloat = '0,0.[00]';
const formatSmallFloat = '0.[00]';
const formatLargeBytes = '0,0.0 b';
const formatSmallBytes = '0.0 b';
const formatLargeAbbreviated = '0,0.[0]a';

const elasticsearchCharts = {
  app: 'elasticsearch'
};
const kibanaCharts = {
  app: 'kibana'
};

const requestRateFields = {
  ...elasticsearchCharts,
  derivative: true,
  format: formatLargeFloat,
  metricAgg: 'max',
  units: '/s'
};
const indexingLatencyFields = {
  ...elasticsearchCharts,
  calculation: indexingLatencyCalculation,
  derivative: false,
  format: formatLargeFloat,
  metricAgg: 'sum',
  units: 'ms'
};
const queryLatencyFields = {
  ...elasticsearchCharts,
  calculation: queryLatencyCalculation,
  derivative: false,
  format: formatLargeFloat,
  metricAgg: 'sum',
  units: 'ms'
};
const indexAvgStatFields = {
  ...elasticsearchCharts,
  type: 'index',
  derivative: false,
  format: formatLargeBytes,
  metricAgg: 'avg',
  units: 'B'
};
const nodeIndexMemory = {
  ...elasticsearchCharts,
  active: true,
  title: 'Index Memory',
  type: 'node',
  derivative: false,
  format: formatSmallBytes,
  metricAgg: 'max',
  units: 'B'
};
const threadPoolQueue = {
  ...elasticsearchCharts,
  active: true,
  title: 'Thread Pool Queues',
  type: 'node',
  derivative: false,
  format: formatSmallFloat,
  metricAgg: 'max',
  units: ''
};
const threadPoolRejected = {
  ...elasticsearchCharts,
  active: true,
  title: 'Thread Pool Rejections',
  type: 'node',
  derivative: true,
  format: formatSmallFloat,
  metricAgg: 'max',
  units: ''
};

module.exports = {
  'cluster_index_request_rate_primary': {
    active: true,
    title: 'Indexing Rate', // title to use for the chart
    label: 'Primary Shards', // label to use for this line in the chart
    field: 'indices_stats._all.primaries.indexing.index_total',
    description: 'The per index rate at which documents are being indexed for primary shards.',
    type: 'index',
    ...requestRateFields
  },
  'cluster_index_request_rate_total': {
    active: true,
    field: 'indices_stats._all.total.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Total Shards',
    description: 'The per index rate at which documents are being indexed for all shards.',
    type: 'index',
    ...requestRateFields
  },
  'cluster_search_request_rate': {
    active: true,
    field: 'indices_stats._all.total.search.query_total',
    label: 'Search Rate',
    description: 'The cluster wide rate at which search reqeusts are being executed.',
    type: 'cluster',
    ...requestRateFields
  },
  'cluster_index_latency': {
    active: true,
    field: 'indices_stats._all.primaries.indexing.index_total',
    label: 'Indexing Latency',
    description: 'The average indexing latency across the entire cluster.',
    aggs: indexingLatencyAggs('indices_stats._all.primaries'),
    type: 'cluster',
    ...indexingLatencyFields
  },
  'cluster_query_latency': {
    active: true,
    field: 'indices_stats._all.total.search.query_total',
    label: 'Search Latency',
    description: 'The average search latency across the entire cluster.',
    aggs: queryLatencyAggs('indices_stats._all.total'),
    type: 'cluster',
    ...queryLatencyFields
  },
  'node_index_latency': {
    active: true,
    field: 'node_stats.indices.indexing.index_total',
    title: 'Latency',
    label: 'Indexing',
    description: 'The average indexing latency',
    aggs: indexingLatencyAggs('node_stats.indices'),
    type: 'node',
    ...indexingLatencyFields
  },
  'node_query_latency': {
    active: true,
    field: 'node_stats.indices.search.query_total',
    title: 'Latency',
    label: 'Search',
    description: 'The average search latency',
    aggs: queryLatencyAggs('node_stats.indices'),
    type: 'node',
    ...queryLatencyFields
  },
  'index_request_rate_primary': {
    active: true,
    field: 'index_stats.primaries.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Primary Shards',
    description: 'The per index rate at which documents are being indexed.',
    format: formatLargeFloat,
    metricAgg: 'max',
    units: '/s',
    type: 'index',
    derivative: true,
    ...elasticsearchCharts
  },
  'index_request_rate_total': {
    active: true,
    field: 'index_stats.total.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Total Shards',
    description: 'The per index rate at which documents are being indexed.',
    type: 'index',
    ...requestRateFields
  },
  'search_request_rate': {
    active: true,
    field: 'index_stats.total.search.query_total',
    label: 'Search Rate',
    description: 'The cluster wide rate at which search reqeusts are being executed.',
    type: 'cluster',
    ...requestRateFields
  },
  'index_latency': {
    active: true,
    field: 'index_stats.primaries.indexing.index_total',
    label: 'Indexing Latency',
    description: 'The average indexing latency across the entire cluster.',
    aggs: indexingLatencyAggs('index_stats.primaries'),
    type: 'cluster',
    ...indexingLatencyFields
  },
  'query_latency': {
    active: true,
    field: 'index_stats.total.search.query_total',
    label: 'Search Latency',
    description: 'The average search latency across the entire cluster.',
    aggs: queryLatencyAggs('index_stats.total'),
    type: 'cluster',
    ...queryLatencyFields
  },
  'node_cpu_utilization': {
    active: true,
    field: 'node_stats.process.cpu.percent',
    label: 'CPU Utilization',
    description: 'The percentage of CPU usage.',
    type: 'node',
    derivative: false,
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '%',
    ...elasticsearchCharts
  },
  'node_segment_count': {
    active: true,
    field: 'node_stats.indices.segments.count',
    label: 'Segment Count',
    description: 'The average segment count.',
    type: 'node',
    derivative: false,
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '',
    ...elasticsearchCharts
  },
  'node_jvm_mem_percent': {
    active: true,
    field: 'node_stats.jvm.mem.heap_used_percent',
    label: 'JVM Heap Usage',
    description: 'The amound of heap used by the JVM',
    type: 'node',
    derivative: false,
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '%',
    ...elasticsearchCharts
  },
  'node_load_average': {
    active: true,
    field: 'node_stats.os.cpu.load_average.1m',
    label: 'System Load Average',
    description: 'The amount of load used for the last 1 minute.',
    type: 'node',
    derivative: false,
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '',
    ...elasticsearchCharts
  },
  'node_index_mem_overall': {
    field: 'node_stats.indices.segments.memory_in_bytes',
    label: 'Lucene Total',
    description: 'Memory used by open Lucene segment files',
    ...nodeIndexMemory
  },
  'node_index_mem_doc_values': {
    field: 'node_stats.indices.segments.doc_values_memory_in_bytes',
    label: 'Doc Values',
    description: 'Memory used for Doc Values',
    ...nodeIndexMemory
  },
  'node_index_mem_fixed_bit_set': {
    field: 'node_stats.indices.segments.norms_memory_in_bytes',
    label: 'Fixed Bitsets',
    description: 'Memory used for Nested Documents',
    ...nodeIndexMemory
  },
  'node_index_mem_norms': {
    field: 'node_stats.indices.segments.norms_memory_in_bytes',
    label: 'Norms',
    description: 'Memory used in Lucene segments for Norms',
    ...nodeIndexMemory
  },
  'node_index_mem_points': {
    field: 'node_stats.indices.segments.points_memory_in_bytes',
    label: 'Points',
    description: 'Memory used in Lucene segments for Points (e.g., numerics and geo)',
    ...nodeIndexMemory
  },
  'node_index_mem_stored_fields': {
    field: 'node_stats.indices.segments.stored_fields_memory_in_bytes',
    label: 'Stored Fields',
    description: 'Memory used in Lucene segments for Stored Fields',
    ...nodeIndexMemory
  },
  'node_index_mem_term_vectors': {
    field: 'node_stats.indices.segments.term_vectors_memory_in_bytes',
    label: 'Term Vectors',
    description: 'Memory used in Lucene segments for Term Vectors',
    ...nodeIndexMemory
  },
  'node_index_mem_terms': {
    field: 'node_stats.indices.segments.terms_memory_in_bytes',
    label: 'Terms',
    description: 'Memory used in Lucene segments for Terms',
    ...nodeIndexMemory
  },
  'node_index_mem_versions': {
    field: 'node_stats.indices.segments.version_map_memory_in_bytes',
    label: 'Version Map',
    description: 'Memory used for Versions',
    ...nodeIndexMemory
  },
  'node_index_mem_writer': {
    field: 'node_stats.indices.segments.index_writer_memory_in_bytes',
    label: 'Index Writer',
    description: 'Memory used for Lucene Index Writers',
    ...nodeIndexMemory
  },
  'node_free_space': {
    active: true,
    field: 'node_stats.fs.total.available_in_bytes',
    label: 'Disk Free Space',
    description: 'The free disk space available on the node',
    type: 'node',
    derivative: false,
    format: formatSmallBytes,
    metricAgg: 'max',
    units: '',
    ...elasticsearchCharts
  },
  'node_threads_queued_bulk': {
    field: 'node_stats.thread_pool.bulk.queue',
    label: 'Bulk',
    description: 'Bulk thread queue. The number of bulk operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_queued_generic': {
    field: 'node_stats.thread_pool.generic.queue',
    label: 'Generic',
    description: 'Generic thread queue. The number of internal, generic operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_queued_get': {
    field: 'node_stats.thread_pool.get.queue',
    label: 'Get',
    description: 'Get thread queue. The number of get operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_queued_index': {
    field: 'node_stats.thread_pool.index.queue',
    label: 'Index',
    description: 'Index thread queue. The number of index (not bulk) operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_queued_management': {
    field: 'node_stats.thread_pool.management.queue',
    label: 'Management',
    description: 'Management thread queue. The number of internal management operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_queued_search': {
    field: 'node_stats.thread_pool.search.queue',
    label: 'Search',
    description: 'Search thread queue. The number of search operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_queued_watcher': {
    field: 'node_stats.thread_pool.watcher.queue',
    label: 'Watcher',
    description: 'Watcher thread queue. The number of Watcher operations waiting to be processed.',
    ...threadPoolQueue
  },
  'node_threads_rejected_bulk': {
    active: true,
    field: 'node_stats.thread_pool.bulk.rejected',
    label: 'Bulk',
    description: 'Bulk thread rejections. Rejections occur when the queue is full.',
    ...threadPoolRejected
  },
  'node_threads_rejected_generic': {
    field: 'node_stats.thread_pool.generic.rejected',
    label: 'Generic',
    description: 'Generic thread rejections. Rejections occur when the queue is full.',
    ...threadPoolRejected
  },
  'node_threads_rejected_get': {
    field: 'node_stats.thread_pool.get.rejected',
    label: 'Get',
    description: 'Get thread rejections. Rejections occur when the queue is full.',
    ...threadPoolRejected
  },
  'node_threads_rejected_index': {
    field: 'node_stats.thread_pool.index.rejected',
    label: 'Index',
    description: 'Index thread rejections. Rejections occur when the queue is full. You should likely be using bulk!',
    ...threadPoolRejected
  },
  'node_threads_rejected_management': {
    field: 'node_stats.thread_pool.management.rejected',
    label: 'Management',
    description: 'Management thread rejections. Rejections occur when the queue is full.',
    ...threadPoolRejected
  },
  'node_threads_rejected_search': {
    field: 'node_stats.thread_pool.search.rejected',
    label: 'Search',
    description: 'Search thread rejections. Rejections occur when the queue is full.',
    ...threadPoolRejected
  },
  'node_threads_rejected_watcher': {
    field: 'node_stats.thread_pool.watcher.rejected',
    label: 'Watcher',
    description: 'Watcher thread rejections. Rejections occur when the queue is full.',
    ...threadPoolRejected
  },
  'index_throttle_time': {
    active: true,
    field: 'index_stats.primaries.indexing.throttle_time_in_millis',
    label: 'Indexing Throttle Time',
    description: 'The amount of load used for the last 1 minute.',
    type: 'index',
    derivative: true,
    format: formatLargeFloat,
    metricAgg: 'max',
    units: 'ms',
    ...elasticsearchCharts
  },
  'index_shard_query_rate': {
    active: false,
    field: 'index_stats.total.search.query_total',
    label: 'Index Shard Search Rate',
    description: 'Total number of requests (GET /_search)across an index (and across all relevant shards for that index) / <time range>',
    type: 'index',
    derivative: true,
    format: formatSmallFloat,
    metricAgg: 'max',
    units: '',
    ...elasticsearchCharts
  },
  'index_document_count': {
    active: false,
    field: 'index_stats.primaries.docs.count',
    label: 'Document Count',
    description: 'Total number of documents (in primary shards) for an index',
    type: 'index',
    derivative: false,
    format: formatLargeAbbreviated,
    metricAgg: 'max',
    units: '',
    ...elasticsearchCharts
  },
  'index_search_request_rate': {
    active: true,
    field: 'index_stats.total.search.query_total',
    label: 'Search Rate',
    description: 'The per index rate at which search reqeusts are being executed.',
    type: 'index',
    ...requestRateFields
  },
  'index_merge_rate': {
    active: true,
    field: 'index_stats.total.merges.total_size_in_bytes',
    label: 'Indexing Rate',
    description: 'The per index rate at which segements are being merged.',
    type: 'index',
    ...requestRateFields
  },
  'index_size': {
    active: true,
    field: 'index_stats.total.store.size_in_bytes',
    label: 'Index Size',
    description: 'The size of the index.',
    ...indexAvgStatFields
  },
  'index_lucene_memory': {
    active: true,
    field: 'index_stats.total.segments.memory_in_bytes',
    label: 'Lucene Memory',
    description: 'The amount of memory used by Lucene.',
    ...indexAvgStatFields
  },
  'index_fielddata': {
    active: true,
    field: 'index_stats.total.fielddata.memory_size_in_bytes',
    label: 'Fielddata Size',
    description: 'The amount of memory used by fielddata.',
    ...indexAvgStatFields
  },
  'index_refresh_time': {
    active: true,
    field: 'total.refresh.total_time_in_millis',
    label: 'Total Refresh Time',
    description: 'The the amount of time a refresh takes',
    format: formatLargeFloat,
    metricAgg: 'max',
    units: '',
    defaults: { warning: '>1000', critical: '>5000', interval: '1m', periods: 1 },
    type: 'index',
    derivative: true
  },
  'kibana_os_load_1m': {
    title: 'OS Load',
    active: true,
    field: 'kibana_stats.os.load.1m',
    label: '1m',
    description: 'The the amount of time a refresh takes',
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_os_load_5m': {
    title: 'OS Load',
    active: true,
    field: 'kibana_stats.os.load.5m',
    label: '5m',
    description: 'The the amount of time a refresh takes',
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_os_load_15m': {
    title: 'OS Load',
    active: true,
    field: 'kibana_stats.os.load.15m',
    label: '15m',
    description: 'The the amount of time a refresh takes',
    format: formatLargeFloat,
    metricAgg: 'avg',
    units: '',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_memory_heap_size_limit': {
    title: 'Memory Size',
    active: true,
    field: 'kibana_stats.process.memory.heap.size_limit',
    label: 'Heap Size Limit',
    description: 'The limit of memory usage before garbage collection',
    format: formatLargeBytes,
    metricAgg: 'max',
    units: 'B',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_memory_size': {
    title: 'Memory Size',
    active: true,
    field: 'kibana_stats.process.memory.resident_set_size_in_bytes',
    label: 'Memory Size',
    description: 'The amount of memory in RAM used by the Kibana server process',
    format: formatLargeBytes,
    metricAgg: 'avg',
    units: 'B',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_process_delay': {
    active: true,
    field: 'kibana_stats.process.event_loop_delay',
    label: 'Event Loop Delay',
    description: 'The Node event loop delay',
    format: formatSmallFloat,
    metricAgg: 'avg',
    units: 'ms',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_average_response_times': {
    title: 'Response Time',
    active: true,
    field: 'kibana_stats.response_times.average',
    label: 'Average',
    description: 'The average request response time',
    format: formatSmallFloat,
    metricAgg: 'avg',
    units: 'ms',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_max_response_times': {
    title: 'Response Time',
    active: true,
    field: 'kibana_stats.response_times.max',
    label: 'Max',
    description: 'The max request response time',
    format: formatSmallFloat,
    metricAgg: 'avg',
    units: 'ms',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_average_concurrent_connections': {
    active: true,
    field: 'kibana_stats.concurrent_connections',
    label: 'Concurrent Connections',
    description: 'The number of concurrent connections to the server',
    format: formatSmallFloat,
    metricAgg: 'max',
    units: '',
    ...kibanaCharts,
    derivative: false
  },
  'kibana_requests': {
    active: true,
    field: 'kibana_stats.requests.total',
    label: 'Requests',
    description: 'The number of requests received by the server',
    format: formatSmallFloat,
    metricAgg: 'sum',
    units: '',
    ...kibanaCharts,
    derivative: false
  },
};

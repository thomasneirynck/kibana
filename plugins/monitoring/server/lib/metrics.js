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
const formatLargeBytes = '0,0.0b';
const formatSmallBytes = '0.0b';
const formatLargeAbbreviated = '0,0.[0]a';

const requestRateFields = {
  derivative: true,
  format: formatLargeFloat,
  metricAgg: 'max',
  units: '/s'
};
const indexingLatencyFields = {
  calculation: indexingLatencyCalculation,
  derivitave: false,
  format: formatLargeFloat,
  metricAgg: 'sum',
  units: 'ms'
};
const queryLatencyFields = {
  calculation: queryLatencyCalculation,
  derivitave: false,
  format: formatLargeFloat,
  metricAgg: 'sum',
  units: 'ms'
};
const indexAvgStatFields = {
  type: 'index',
  derivative: false,
  format: formatLargeBytes,
  metricAgg: 'avg',
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
    label: 'Indexing Latency',
    description: 'The average indexing latency',
    aggs: indexingLatencyAggs('node_stats.indices'),
    type: 'node',
    ...indexingLatencyFields
  },
  'node_query_latency': {
    active: true,
    field: 'node_stats.indices.search.query_total',
    label: 'Search Latency',
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
    derivative: true
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
    units: '%'
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
    units: ''
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
    units: '%'
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
    units: ''
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
    units: ''
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
    units: 'ms'
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
    units: ''
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
    units: ''
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
    label: 'Field Data Size',
    description: 'The amount of memory used by field data.',
    ...indexAvgStatFields
  },
  'index_refresh_time': {
    active: true,
    field: 'total.refresh.total_time_in_millis',
    label: 'Total Refresh Time',
    description: 'The the amount of time a refresh takes',
    type: 'index',
    derivative: true,
    format: formatLargeFloat,
    metricAgg: 'max',
    units: ''
  }
};

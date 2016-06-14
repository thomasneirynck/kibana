import _ from 'lodash';

import {
  ElasticsearchMetric, RequestRateMetric, KibanaMetric, LatencyMetric,
  NodeIndexMemoryMetric, ThreadPoolQueueMetric, ThreadPoolRejectedMetric,
  IndexAverageStatMetric } from './metric_classes';

import {
  LARGE_FLOAT, SMALL_FLOAT, LARGE_BYTES, SMALL_BYTES, LARGE_ABBREVIATED
} from '../../../lib/formatting';

const metricInstances = {
  'cluster_index_request_rate_primary': new RequestRateMetric({
    title: 'Indexing Rate', // title to use for the chart
    label: 'Primary Shards', // label to use for this line in the chart
    field: 'indices_stats._all.primaries.indexing.index_total',
    description: 'The per index rate at which documents are being indexed for primary shards.',
    type: 'index',
  }),
  'cluster_index_request_rate_total': new RequestRateMetric({
    field: 'indices_stats._all.total.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Total Shards',
    description: 'The per index rate at which documents are being indexed for all shards.',
    type: 'index'
  }),
  'cluster_search_request_rate': new RequestRateMetric({
    field: 'indices_stats._all.total.search.query_total',
    label: 'Search Rate',
    description: 'The cluster wide rate at which search reqeusts are being executed.',
    type: 'cluster'
  }),
  'cluster_index_latency': new LatencyMetric({
    metric: 'index',
    fieldSource: 'indices_stats._all.primaries',
    field: 'indices_stats._all.primaries.indexing.index_total',
    label: 'Indexing Latency',
    description: 'The average indexing latency across the entire cluster.',
    type: 'cluster'
  }),
  'node_index_latency': new LatencyMetric({
    metric: 'index',
    fieldSource: 'node_stats.indices',
    field: 'node_stats.indices.indexing.index_total',
    title: 'Latency',
    label: 'Indexing',
    description: 'The average indexing latency',
    type: 'node'
  }),
  'index_latency': new LatencyMetric({
    metric: 'index',
    fieldSource: 'index_stats.primaries',
    field: 'index_stats.primaries.indexing.index_total',
    label: 'Indexing Latency',
    description: 'The average indexing latency across the entire cluster.',
    type: 'cluster'
  }),
  'cluster_query_latency': new LatencyMetric({
    metric: 'query',
    fieldSource: 'indices_stats._all.total',
    field: 'indices_stats._all.total.search.query_total',
    label: 'Search Latency',
    description: 'The average search latency across the entire cluster.',
    type: 'cluster'
  }),
  'node_query_latency': new LatencyMetric({
    metric: 'query',
    fieldSource: 'node_stats.indices',
    field: 'node_stats.indices.search.query_total',
    title: 'Latency',
    label: 'Search',
    description: 'The average search latency',
    type: 'node'
  }),
  'query_latency': new LatencyMetric({
    metric: 'query',
    fieldSource: 'index_stats.total',
    field: 'index_stats.total.search.query_total',
    label: 'Search Latency',
    description: 'The average search latency across the entire cluster.',
    type: 'cluster'
  }),
  'index_request_rate_primary': new ElasticsearchMetric({
    field: 'index_stats.primaries.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Primary Shards',
    description: 'The per index rate at which documents are being indexed.',
    format: LARGE_FLOAT,
    metricAgg: 'max',
    units: '/s',
    type: 'index',
    derivative: true
  }),
  'index_request_rate_total': new RequestRateMetric({
    field: 'index_stats.total.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Total Shards',
    description: 'The per index rate at which documents are being indexed.',
    type: 'index'
  }),
  'search_request_rate': new RequestRateMetric({
    field: 'index_stats.total.search.query_total',
    label: 'Search Rate',
    description: 'The cluster wide rate at which search reqeusts are being executed.',
    type: 'cluster'
  }),
  'node_cpu_utilization': new ElasticsearchMetric({
    field: 'node_stats.process.cpu.percent',
    label: 'CPU Utilization',
    description: 'The percentage of CPU usage.',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: '%'
  }),
  'node_segment_count': new ElasticsearchMetric({
    field: 'node_stats.indices.segments.count',
    label: 'Segment Count',
    description: 'The average segment count.',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'node_jvm_mem_percent': new ElasticsearchMetric({
    field: 'node_stats.jvm.mem.heap_used_percent',
    label: 'JVM Heap Usage',
    description: 'The amound of heap used by the JVM',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: '%'
  }),
  'node_load_average': new ElasticsearchMetric({
    field: 'node_stats.os.cpu.load_average.1m',
    label: 'System Load Average',
    description: 'The amount of load used for the last 1 minute.',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'node_index_mem_overall': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.memory_in_bytes',
    label: 'Lucene Total',
    description: 'Memory used by open Lucene segment files',
  }),
  'node_index_mem_doc_values': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.doc_values_memory_in_bytes',
    label: 'Doc Values',
    description: 'Memory used for Doc Values'
  }),
  'node_index_mem_fixed_bit_set': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.norms_memory_in_bytes',
    label: 'Fixed Bitsets',
    description: 'Memory used for Nested Documents'
  }),
  'node_index_mem_norms': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.norms_memory_in_bytes',
    label: 'Norms',
    description: 'Memory used in Lucene segments for Norms'
  }),
  'node_index_mem_points': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.points_memory_in_bytes',
    label: 'Points',
    description: 'Memory used in Lucene segments for Points (e.g., numerics and geo)'
  }),
  'node_index_mem_stored_fields': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.stored_fields_memory_in_bytes',
    label: 'Stored Fields',
    description: 'Memory used in Lucene segments for Stored Fields'
  }),
  'node_index_mem_term_vectors': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.term_vectors_memory_in_bytes',
    label: 'Term Vectors',
    description: 'Memory used in Lucene segments for Term Vectors'
  }),
  'node_index_mem_terms': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.terms_memory_in_bytes',
    label: 'Terms',
    description: 'Memory used in Lucene segments for Terms'
  }),
  'node_index_mem_versions': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.version_map_memory_in_bytes',
    label: 'Version Map',
    description: 'Memory used for Versions'
  }),
  'node_index_mem_writer': new NodeIndexMemoryMetric({
    field: 'node_stats.indices.segments.index_writer_memory_in_bytes',
    label: 'Index Writer',
    description: 'Memory used for Lucene Index Writers'
  }),
  'node_free_space': new ElasticsearchMetric({
    field: 'node_stats.fs.total.available_in_bytes',
    label: 'Disk Free Space',
    description: 'The free disk space available on the node',
    type: 'node',
    format: SMALL_BYTES,
    metricAgg: 'max',
    units: ''
  }),
  'node_threads_queued_bulk': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.bulk.queue',
    label: 'Bulk',
    description: 'Bulk thread queue. The number of bulk operations waiting to be processed.'
  }),
  'node_threads_queued_generic': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.generic.queue',
    label: 'Generic',
    description: 'Generic thread queue. The number of internal, generic operations waiting to be processed.'
  }),
  'node_threads_queued_get': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.get.queue',
    label: 'Get',
    description: 'Get thread queue. The number of get operations waiting to be processed.'
  }),
  'node_threads_queued_index': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.index.queue',
    label: 'Index',
    description: 'Index thread queue. The number of index (not bulk) operations waiting to be processed.'
  }),
  'node_threads_queued_management': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.management.queue',
    label: 'Management',
    description: 'Management thread queue. The number of internal management operations waiting to be processed.'
  }),
  'node_threads_queued_search': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.search.queue',
    label: 'Search',
    description: 'Search thread queue. The number of search operations waiting to be processed.'
  }),
  'node_threads_queued_watcher': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.watcher.queue',
    label: 'Watcher',
    description: 'Watcher thread queue. The number of Watcher operations waiting to be processed.'
  }),
  'node_threads_rejected_bulk': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.bulk.rejected',
    label: 'Bulk',
    description: 'Bulk thread rejections. Rejections occur when the queue is full.'
  }),
  'node_threads_rejected_generic': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.generic.rejected',
    label: 'Generic',
    description: 'Generic thread rejections. Rejections occur when the queue is full.'
  }),
  'node_threads_rejected_get': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.get.rejected',
    label: 'Get',
    description: 'Get thread rejections. Rejections occur when the queue is full.'
  }),
  'node_threads_rejected_index': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.index.rejected',
    label: 'Index',
    description: 'Index thread rejections. Rejections occur when the queue is full. You should likely be using bulk!'
  }),
  'node_threads_rejected_management': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.management.rejected',
    label: 'Management',
    description: 'Management thread rejections. Rejections occur when the queue is full.'
  }),
  'node_threads_rejected_search': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.search.rejected',
    label: 'Search',
    description: 'Search thread rejections. Rejections occur when the queue is full.'
  }),
  'node_threads_rejected_watcher': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.watcher.rejected',
    label: 'Watcher',
    description: 'Watcher thread rejections. Rejections occur when the queue is full.'
  }),
  'index_throttle_time': new ElasticsearchMetric({
    field: 'index_stats.primaries.indexing.throttle_time_in_millis',
    label: 'Indexing Throttle Time',
    description: 'The amount of load used for the last 1 minute.',
    type: 'index',
    derivative: true,
    format: LARGE_FLOAT,
    metricAgg: 'max',
    units: 'ms'
  }),
  'index_shard_query_rate': new ElasticsearchMetric({
    field: 'index_stats.total.search.query_total',
    label: 'Index Shard Search Rate',
    description: 'Total number of requests (GET /_search)across an index (and across all relevant shards for that index) / <time range>',
    type: 'index',
    derivative: true,
    format: SMALL_FLOAT,
    metricAgg: 'max',
    units: ''
  }),
  'index_document_count': new ElasticsearchMetric({
    field: 'index_stats.primaries.docs.count',
    label: 'Document Count',
    description: 'Total number of documents (in primary shards) for an index',
    type: 'index',
    format: LARGE_ABBREVIATED,
    metricAgg: 'max',
    units: ''
  }),
  'index_search_request_rate': new RequestRateMetric({
    field: 'index_stats.total.search.query_total',
    label: 'Search Rate',
    description: 'The per index rate at which search reqeusts are being executed.',
    type: 'index'
  }),
  'index_merge_rate': new RequestRateMetric({
    field: 'index_stats.total.merges.total_size_in_bytes',
    label: 'Indexing Rate',
    description: 'The per index rate at which segements are being merged.',
    type: 'index'
  }),
  'index_size': new IndexAverageStatMetric({
    field: 'index_stats.total.store.size_in_bytes',
    label: 'Index Size',
    description: 'The size of the index.'
  }),
  'index_lucene_memory': new IndexAverageStatMetric({
    field: 'index_stats.total.segments.memory_in_bytes',
    label: 'Lucene Memory',
    description: 'The amount of memory used by Lucene.'
  }),
  'index_fielddata': new IndexAverageStatMetric({
    field: 'index_stats.total.fielddata.memory_size_in_bytes',
    label: 'Fielddata Size',
    description: 'The amount of memory used by fielddata.'
  }),
  'index_refresh_time': new ElasticsearchMetric({
    field: 'total.refresh.total_time_in_millis',
    label: 'Total Refresh Time',
    description: 'The the amount of time a refresh takes',
    format: LARGE_FLOAT,
    metricAgg: 'max',
    units: '',
    type: 'index',
    derivative: true
  }),
  'kibana_os_load_1m': new KibanaMetric({
    title: 'OS Load',
    field: 'kibana_stats.os.load.1m',
    label: '1m',
    description: 'The the amount of time a refresh takes',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'kibana_os_load_5m': new KibanaMetric({
    title: 'OS Load',
    field: 'kibana_stats.os.load.5m',
    label: '5m',
    description: 'The the amount of time a refresh takes',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'kibana_os_load_15m': new KibanaMetric({
    title: 'OS Load',
    field: 'kibana_stats.os.load.15m',
    label: '15m',
    description: 'The the amount of time a refresh takes',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'kibana_memory_heap_size_limit': new KibanaMetric({
    title: 'Memory Size',
    field: 'kibana_stats.process.memory.heap.size_limit',
    label: 'Heap Size Limit',
    description: 'The limit of memory usage before garbage collection',
    format: LARGE_BYTES,
    metricAgg: 'max',
    units: 'B'
  }),
  'kibana_memory_size': new KibanaMetric({
    title: 'Memory Size',
    field: 'kibana_stats.process.memory.resident_set_size_in_bytes',
    label: 'Memory Size',
    description: 'The amount of memory in RAM used by the Kibana server process',
    format: LARGE_BYTES,
    metricAgg: 'avg',
    units: 'B'
  }),
  'kibana_process_delay': new KibanaMetric({
    field: 'kibana_stats.process.event_loop_delay',
    label: 'Event Loop Delay',
    description: 'The Node event loop delay',
    format: SMALL_FLOAT,
    metricAgg: 'avg',
    units: 'ms'
  }),
  'kibana_average_response_times': new KibanaMetric({
    title: 'Response Time',
    field: 'kibana_stats.response_times.average',
    label: 'Average',
    description: 'The average request response time',
    format: SMALL_FLOAT,
    metricAgg: 'avg',
    units: 'ms'
  }),
  'kibana_max_response_times': new KibanaMetric({
    title: 'Response Time',
    field: 'kibana_stats.response_times.max',
    label: 'Max',
    description: 'The max request response time',
    format: SMALL_FLOAT,
    metricAgg: 'avg',
    units: 'ms'
  }),
  'kibana_average_concurrent_connections': new KibanaMetric({
    field: 'kibana_stats.concurrent_connections',
    label: 'Concurrent Connections',
    description: 'The number of concurrent connections to the server',
    format: SMALL_FLOAT,
    metricAgg: 'max',
    units: ''
  }),
  'kibana_requests': new KibanaMetric({
    field: 'kibana_stats.requests.total',
    label: 'Requests',
    description: 'The number of requests received by the server',
    format: SMALL_FLOAT,
    metricAgg: 'sum',
    units: ''
  }),
};

const metrics = _.reduce(Object.keys(metricInstances), (accumulated, key) => {
  accumulated[key] = metricInstances[key].toPlainObject();
  return accumulated;
}, {});

export default metrics;

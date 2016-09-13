import _ from 'lodash';

import {
  ElasticsearchMetric, RequestRateMetric, KibanaMetric, LatencyMetric,
  NodeIndexMemoryMetric, ThreadPoolQueueMetric, ThreadPoolRejectedMetric,
  IndexAverageStatMetric, SingleIndexMemoryMetric, IndexMemoryMetric
} from './metric_classes';

import {
  LARGE_FLOAT, SMALL_FLOAT, LARGE_BYTES, SMALL_BYTES, LARGE_ABBREVIATED
} from '../../../lib/formatting';

const metricInstances = {
  'cluster_index_request_rate_primary': new RequestRateMetric({
    title: 'Indexing Rate', // title to use for the chart
    label: 'Primary Shards', // label to use for this line in the chart
    field: 'indices_stats._all.primaries.indexing.index_total',
    description: 'Number of documents being indexed for primary shards.',
    type: 'index'
  }),
  'cluster_index_request_rate_total': new RequestRateMetric({
    field: 'indices_stats._all.total.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Total Shards',
    description: 'Number of documents being indexed for primary and replica shards.',
    type: 'index'
  }),
  'cluster_search_request_rate': new RequestRateMetric({
    field: 'indices_stats._all.total.search.query_total',
    title: 'Search Rate',
    label: 'Total Shards',
    description: 'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!', // eslint-disable-line max-len
    type: 'cluster'
  }),
  'cluster_index_latency': new LatencyMetric({
    metric: 'index',
    fieldSource: 'indices_stats._all.primaries',
    field: 'indices_stats._all.primaries.indexing.index_total',
    label: 'Indexing Latency',
    description: 'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. This only considers primary shards.', // eslint-disable-line max-len
    type: 'cluster'
  }),
  'node_index_latency': new LatencyMetric({
    metric: 'index',
    fieldSource: 'node_stats.indices',
    field: 'node_stats.indices.indexing.index_total',
    title: 'Latency',
    label: 'Indexing',
    description: 'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. This considers any shard located on this node, including replicas.', // eslint-disable-line max-len
    type: 'node'
  }),
  'index_latency': new LatencyMetric({
    metric: 'index',
    fieldSource: 'index_stats.primaries',
    field: 'index_stats.primaries.indexing.index_total',
    label: 'Indexing Latency',
    description: 'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. This only considers primary shards.', // eslint-disable-line max-len
    type: 'cluster'
  }),
  'cluster_query_latency': new LatencyMetric({
    metric: 'query',
    fieldSource: 'indices_stats._all.total',
    field: 'indices_stats._all.total.search.query_total',
    label: 'Search Latency',
    description: 'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. This considers primary and replica shards.', // eslint-disable-line max-len
    type: 'cluster'
  }),
  'node_query_latency': new LatencyMetric({
    metric: 'query',
    fieldSource: 'node_stats.indices',
    field: 'node_stats.indices.search.query_total',
    title: 'Latency',
    label: 'Search',
    description: 'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. This considers primary and replica shards.', // eslint-disable-line max-len
    type: 'node'
  }),
  'query_latency': new LatencyMetric({
    metric: 'query',
    fieldSource: 'index_stats.total',
    field: 'index_stats.total.search.query_total',
    label: 'Search Latency',
    description: 'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. This considers primary and replica shards.', // eslint-disable-line max-len
    type: 'cluster'
  }),
  'index_mem_overall': new SingleIndexMemoryMetric({
    field: 'memory_in_bytes',
    label: 'Lucene Total',
    description: 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.'
  }),
  'index_mem_doc_values': new SingleIndexMemoryMetric({
    field: 'doc_values_memory_in_bytes',
    label: 'Doc Values',
    description: 'Heap memory used by Doc Values. This is a part of Lucene Total.'
  }),
  // Note: This is not segment memory, unlike SingleIndexMemoryMetrics
  'index_mem_fielddata': new IndexMemoryMetric({
    field: 'index_stats.total.fielddata.memory_size_in_bytes',
    label: 'Fielddata',
    description: 'Heap memory used by Fielddata (e.g., global ordinals or explicitly enabled fielddata on text fields). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
    type: 'index'
  }),
  'index_mem_fixed_bit_set': new SingleIndexMemoryMetric({
    field: 'fixed_bit_set_memory_in_bytes',
    label: 'Fixed Bitsets',
    description: 'Heap memory used by Fixed Bit Sets (e.g., deeply nested documents). This is a part of Lucene Total.'
  }),
  'index_mem_norms': new SingleIndexMemoryMetric({
    field: 'norms_memory_in_bytes',
    label: 'Norms',
    description: 'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.'
  }),
  'index_mem_points': new SingleIndexMemoryMetric({
    field: 'points_memory_in_bytes',
    label: 'Points',
    description: 'Heap memory used by Points (e.g., numbers, IPs, and geo data). This is a part of Lucene Total.'
  }),
  // Note: This is not segment memory, unlike SingleIndexMemoryMetrics
  'index_mem_query_cache': new IndexMemoryMetric({
    field: 'index_stats.total.query_cache.memory_size_in_bytes',
    label: 'Query Cache',
    description: 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    type: 'index'
  }),
  // Note: This is not segment memory, unlike SingleIndexMemoryMetrics
  'index_mem_request_cache': new IndexMemoryMetric({
    field: 'index_stats.total.request_cache.memory_size_in_bytes',
    label: 'Request Cache',
    description: 'Heap memory used by Request Cache (e.g., instant aggregations). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
    type: 'index'
  }),
  'index_mem_stored_fields': new SingleIndexMemoryMetric({
    field: 'stored_fields_memory_in_bytes',
    label: 'Stored Fields',
    description: 'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.'
  }),
  'index_mem_term_vectors': new SingleIndexMemoryMetric({
    field: 'term_vectors_memory_in_bytes',
    label: 'Term Vectors',
    description: 'Heap memory used by Term Vectors. This is a part of Lucene Total.'
  }),
  'index_mem_terms': new SingleIndexMemoryMetric({
    field: 'terms_memory_in_bytes',
    label: 'Terms',
    description: 'Heap memory used by Terms (e.g., text). This is a part of Lucene Total.'
  }),
  'index_mem_versions': new SingleIndexMemoryMetric({
    field: 'version_map_memory_in_bytes',
    label: 'Version Map',
    description: 'Heap memory used by Versioning (e.g., updates and deletes). This is a part of Lucene Total.'
  }),
  'index_mem_writer': new SingleIndexMemoryMetric({
    field: 'index_writer_memory_in_bytes',
    label: 'Index Writer',
    description: 'Heap memory used by the Index Writer. This is a part of Lucene Total.'
  }),
  'index_request_rate_primary': new ElasticsearchMetric({
    field: 'index_stats.primaries.indexing.index_total',
    title: 'Indexing Rate',
    label: 'Primary Shards',
    description: 'Number of documents being indexed for primary shards.',
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
    description: 'Number of documents being indexed for primary and replica shards.',
    type: 'index'
  }),
  'index_segment_count': new ElasticsearchMetric({
    field: 'index_stats.total.segments.count',
    label: 'Segment Count',
    description: 'Average segment count for primary and replica shards.',
    type: 'index',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'search_request_rate': new RequestRateMetric({
    field: 'index_stats.total.search.query_total',
    title: 'Search Rate',
    label: 'Total Shards',
    description: 'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!', // eslint-disable-line max-len
    type: 'cluster'
  }),
  'node_cpu_utilization': new ElasticsearchMetric({
    field: 'node_stats.process.cpu.percent',
    label: 'CPU Utilization',
    description: 'Percentage of CPU usage (100% is the max).',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: '%'
  }),
  'node_segment_count': new ElasticsearchMetric({
    field: 'node_stats.indices.segments.count',
    label: 'Segment Count',
    description: 'Average segment count for primary and replica shards on this node.',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'node_jvm_mem_max_in_bytes': new ElasticsearchMetric({
    field: 'node_stats.jvm.mem.heap_max_in_bytes',
    title: 'JVM Heap',
    label: 'Max Heap',
    description: 'Total heap available to Elasticsearch running in the JVM.',
    type: 'node',
    format: SMALL_BYTES,
    metricAgg: 'max',
    units: 'B'
  }),
  'node_jvm_mem_used_in_bytes': new ElasticsearchMetric({
    field: 'node_stats.jvm.mem.heap_used_in_bytes',
    title: 'JVM Heap',
    label: 'Used Heap',
    description: 'Total heap used by Elasticsearch running in the JVM.',
    type: 'node',
    format: SMALL_BYTES,
    metricAgg: 'max',
    units: 'B'
  }),
  'node_jvm_mem_percent': new ElasticsearchMetric({
    field: 'node_stats.jvm.mem.heap_used_percent',
    title: 'JVM Heap',
    label: 'Used Heap',
    description: 'Total heap used by Elasticsearch running in the JVM.',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'max',
    units: '%'
  }),
  'node_load_average': new ElasticsearchMetric({
    field: 'node_stats.os.cpu.load_average.1m',
    title: 'System Load',
    label: '1m',
    description: 'Load average over the last minute.',
    type: 'node',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'node_index_mem_overall': new NodeIndexMemoryMetric({
    field: 'memory_in_bytes',
    label: 'Lucene Total',
    description: 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards on this node.' // eslint-disable-line max-len
  }),
  'node_index_mem_doc_values': new NodeIndexMemoryMetric({
    field: 'doc_values_memory_in_bytes',
    label: 'Doc Values',
    description: 'Heap memory used by Doc Values. This is a part of Lucene Total.'
  }),
  // Note: This is not segment memory, unlike the rest of the SingleIndexMemoryMetrics
  'node_index_mem_fielddata': new IndexMemoryMetric({
    field: 'node_stats.indices.fielddata.memory_size_in_bytes',
    label: 'Fielddata',
    description: 'Heap memory used by Fielddata (e.g., global ordinals or explicitly enabled fielddata on text fields). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
    type: 'node'
  }),
  'node_index_mem_fixed_bit_set': new NodeIndexMemoryMetric({
    field: 'fixed_bit_set_memory_in_bytes',
    label: 'Fixed Bitsets',
    description: 'Heap memory used by Fixed Bit Sets (e.g., deeply nested documents). This is a part of Lucene Total.'
  }),
  'node_index_mem_norms': new NodeIndexMemoryMetric({
    field: 'norms_memory_in_bytes',
    label: 'Norms',
    description: 'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.'
  }),
  'node_index_mem_points': new NodeIndexMemoryMetric({
    field: 'points_memory_in_bytes',
    label: 'Points',
    description: 'Heap memory used by Points (e.g., numbers, IPs, and geo data). This is a part of Lucene Total.'
  }),
  // Note: This is not segment memory, unlike SingleIndexMemoryMetrics
  'node_index_mem_query_cache': new IndexMemoryMetric({
    field: 'node_stats.indices.query_cache.memory_size_in_bytes',
    label: 'Query Cache',
    description: 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    type: 'index'
  }),
  // Note: This is not segment memory, unlike SingleIndexMemoryMetrics
  'node_index_mem_request_cache': new IndexMemoryMetric({
    field: 'node_stats.indices.request_cache.memory_size_in_bytes',
    label: 'Request Cache',
    description: 'Heap memory used by Request Cache (e.g., instant aggregations). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
    type: 'index'
  }),
  'node_index_mem_stored_fields': new NodeIndexMemoryMetric({
    field: 'stored_fields_memory_in_bytes',
    label: 'Stored Fields',
    description: 'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.'
  }),
  'node_index_mem_term_vectors': new NodeIndexMemoryMetric({
    field: 'term_vectors_memory_in_bytes',
    label: 'Term Vectors',
    description: 'Heap memory used by Term Vectors. This is a part of Lucene Total.'
  }),
  'node_index_mem_terms': new NodeIndexMemoryMetric({
    field: 'terms_memory_in_bytes',
    label: 'Terms',
    description: 'Heap memory used by Terms (e.g., text). This is a part of Lucene Total.'
  }),
  'node_index_mem_versions': new NodeIndexMemoryMetric({
    field: 'version_map_memory_in_bytes',
    label: 'Version Map',
    description: 'Heap memory used by Versioning (e.g., updates and deletes). This is a part of Lucene Total.'
  }),
  'node_index_mem_writer': new NodeIndexMemoryMetric({
    field: 'index_writer_memory_in_bytes',
    label: 'Index Writer',
    description: 'Heap memory used by the Index Writer. This is a part of Lucene Total.'
  }),
  'node_free_space': new ElasticsearchMetric({
    field: 'node_stats.fs.total.available_in_bytes',
    label: 'Disk Free Space',
    description: 'Free disk space available on the node.',
    type: 'node',
    format: SMALL_BYTES,
    metricAgg: 'max',
    units: ''
  }),
  'node_threads_queued_bulk': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.bulk.queue',
    label: 'Bulk',
    description: 'Number of bulk indexing operations waiting to be processed on this node. A single bulk request can create multiple bulk operations.' // eslint-disable-line max-len
  }),
  'node_threads_queued_generic': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.generic.queue',
    label: 'Generic',
    description: 'Number of generic (internal) operations waiting to be processed on this node.'
  }),
  'node_threads_queued_get': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.get.queue',
    title: 'Thread Queue',
    label: 'Get',
    description: 'Number of get operations waiting to be processed on this node.'
  }),
  'node_threads_queued_index': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.index.queue',
    label: 'Index',
    description: 'Number of non-bulk, index operations waiting to be processed on this node.'
  }),
  'node_threads_queued_management': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.management.queue',
    label: 'Management',
    description: 'Number of management (internal) operations waiting to be processed on this node.'
  }),
  'node_threads_queued_search': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.search.queue',
    label: 'Search',
    description: 'Number of search operations waiting to be processed on this node. A single search request can create multiple search operations.' // eslint-disable-line max-len
  }),
  'node_threads_queued_watcher': new ThreadPoolQueueMetric({
    field: 'node_stats.thread_pool.watcher.queue',
    label: 'Watcher',
    description: 'Number of Watcher operations waiting to be processed on this node.'
  }),
  'node_threads_rejected_bulk': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.bulk.rejected',
    label: 'Bulk',
    description: 'Bulk rejections. These occur when the queue is full.'
  }),
  'node_threads_rejected_generic': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.generic.rejected',
    label: 'Generic',
    description: 'Generic (internal) rejections. These occur when the queue is full.'
  }),
  'node_threads_rejected_get': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.get.rejected',
    label: 'Get',
    description: 'Get rejections. These occur when the queue is full.'
  }),
  'node_threads_rejected_index': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.index.rejected',
    label: 'Index',
    description: 'Index rejections. These occur when the queue is full. You should look at bulk indexing.'
  }),
  'node_threads_rejected_management': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.management.rejected',
    label: 'Management',
    description: 'Get (internal) rejections. These occur when the queue is full.'
  }),
  'node_threads_rejected_search': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.search.rejected',
    label: 'Search',
    description: 'Search rejections. These occur when the queue is full. This can indicate over-sharding.'
  }),
  'node_threads_rejected_watcher': new ThreadPoolRejectedMetric({
    field: 'node_stats.thread_pool.watcher.rejected',
    label: 'Watcher',
    description: 'Watch rejections. These occur when the queue is full. This can indicate stuck-Watches.'
  }),
  'index_throttle_time': new ElasticsearchMetric({
    field: 'index_stats.primaries.indexing.throttle_time_in_millis',
    label: 'Index Throttling',
    description: 'Amount of time spent with index throttling, which indicates slow merging.',
    type: 'index',
    derivative: true,
    format: LARGE_FLOAT,
    metricAgg: 'max',
    units: 'ms'
  }),
  'index_document_count': new ElasticsearchMetric({
    field: 'index_stats.primaries.docs.count',
    label: 'Document Count',
    description: 'Total number of documents, only including primary shards.',
    type: 'index',
    format: LARGE_ABBREVIATED,
    metricAgg: 'max',
    units: ''
  }),
  'index_search_request_rate': new RequestRateMetric({
    field: 'index_stats.total.search.query_total',
    title: 'Search Rate',
    label: 'Total Shards',
    description: 'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!', // eslint-disable-line max-len
    type: 'index'
  }),
  'index_merge_rate': new RequestRateMetric({
    field: 'index_stats.total.merges.total_size_in_bytes',
    label: 'Merge Rate',
    description: 'Amount in bytes of merged segments. Larger numbers indicate heavier disk activity.',
    type: 'index'
  }),
  'index_size': new IndexAverageStatMetric({
    field: 'index_stats.total.store.size_in_bytes',
    label: 'Index Size',
    description: 'Size of the index on disk for primary and replica shards.'
  }),
  'index_refresh_time': new ElasticsearchMetric({
    field: 'total.refresh.total_time_in_millis',
    label: 'Total Refresh Time',
    description: 'Time spent on Elasticsearch refresh for primary and replica shards.',
    format: LARGE_FLOAT,
    metricAgg: 'max',
    units: '',
    type: 'index',
    derivative: true
  }),
  'kibana_os_load_1m': new KibanaMetric({
    title: 'System Load',
    field: 'kibana_stats.os.load.1m',
    label: '1m',
    description: 'Load average over the last minute.',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'kibana_os_load_5m': new KibanaMetric({
    title: 'System Load',
    field: 'kibana_stats.os.load.5m',
    label: '5m',
    description: 'Load average over the last 5 minutes.',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'kibana_os_load_15m': new KibanaMetric({
    title: 'System Load',
    field: 'kibana_stats.os.load.15m',
    label: '15m',
    description: 'Load average over the last 15 minutes.',
    format: LARGE_FLOAT,
    metricAgg: 'avg',
    units: ''
  }),
  'kibana_memory_heap_size_limit': new KibanaMetric({
    title: 'Memory Size',
    field: 'kibana_stats.process.memory.heap.size_limit',
    label: 'Heap Size Limit',
    description: 'Limit of memory usage before garbage collection.',
    format: LARGE_BYTES,
    metricAgg: 'max',
    units: 'B'
  }),
  'kibana_memory_size': new KibanaMetric({
    title: 'Memory Size',
    field: 'kibana_stats.process.memory.resident_set_size_in_bytes',
    label: 'Memory Size',
    description: 'Total heap used by Kibana running in Node.js.',
    format: LARGE_BYTES,
    metricAgg: 'avg',
    units: 'B'
  }),
  'kibana_process_delay': new KibanaMetric({
    field: 'kibana_stats.process.event_loop_delay',
    label: 'Event Loop Delay',
    description: 'Delay in Kibana server event loops. Longer delays may indicate blocking events in server thread, such as synchronous functions taking large amount of CPU time.', // eslint-disable-line max-len
    format: SMALL_FLOAT,
    metricAgg: 'avg',
    units: 'ms'
  }),
  'kibana_average_response_times': new KibanaMetric({
    title: 'Client Response Time',
    field: 'kibana_stats.response_times.average',
    label: 'Average',
    description: 'Average response time for client requests to the Kibana instance.',
    format: SMALL_FLOAT,
    metricAgg: 'avg',
    units: 'ms'
  }),
  'kibana_max_response_times': new KibanaMetric({
    title: 'Client Response Time',
    field: 'kibana_stats.response_times.max',
    label: 'Max',
    description: 'Maximum response time for client requests to the Kibana instance.',
    format: SMALL_FLOAT,
    metricAgg: 'avg',
    units: 'ms'
  }),
  'kibana_average_concurrent_connections': new KibanaMetric({
    field: 'kibana_stats.concurrent_connections',
    label: 'HTTP Connections',
    description: 'Total number of open socket connections to the Kibana instance.',
    format: SMALL_FLOAT,
    metricAgg: 'max',
    units: ''
  }),
  'kibana_requests': new KibanaMetric({
    field: 'kibana_stats.requests.total',
    label: 'Client Requests',
    description: 'Total number of client requests received by the Kibana instance.',
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

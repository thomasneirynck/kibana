import _ from 'lodash';

function indexingLatencyCalculation(last) {
  const indexTimeInMillis = _.get(last, 'index_time_in_millis_deriv.value');
  const indexTimeTotal = _.get(last, 'index_total_deriv.value');
  if (indexTimeInMillis && indexTimeTotal) {
    if (indexTimeInMillis < 0 || indexTimeTotal < 0) {
      return null;
    }
    return indexTimeInMillis / indexTimeTotal;
  }
  return 0;
}

function queryLatencyCalculation(last) {
  const queryTimeInMillis = _.get(last, 'query_time_in_millis_deriv.value');
  const queryTimeTotal = _.get(last, 'query_total_deriv.value');
  if (queryTimeInMillis && queryTimeTotal) {
    if (queryTimeInMillis < 0 || queryTimeTotal < 0) {
      return null;
    }
    return queryTimeInMillis / queryTimeTotal;
  }
  return 0;
}

export const expected = {
  'cluster_index_latency': {
    'aggs': {
      'index_time_in_millis': {
        'max': {
          'field': 'indices_stats._all.primaries.indexing.index_time_in_millis'
        }
      },
      'index_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'index_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'index_total': {
        'max': {
          'field': 'indices_stats._all.primaries.indexing.index_total'
        }
      },
      'index_total_deriv': {
        'derivative': {
          'buckets_path': 'index_total',
          'gap_policy': 'skip'
        }
      }
    },
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'calculation': indexingLatencyCalculation,
    'derivative': false,
    'description': 'The average indexing latency across the entire cluster.',
    'field': 'indices_stats._all.primaries.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Indexing Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'cluster_index_request_rate_primary': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The per index rate at which documents are being indexed for primary shards.',
    'field': 'indices_stats._all.primaries.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Primary Shards',
    'metricAgg': 'max',
    'title': 'Indexing Rate',
    'type': 'index',
    'units': '/s'
  },
  'cluster_index_request_rate_total': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The per index rate at which documents are being indexed for all shards.',
    'field': 'indices_stats._all.total.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Total Shards',
    'metricAgg': 'max',
    'title': 'Indexing Rate',
    'type': 'index',
    'units': '/s'
  },
  'cluster_query_latency': {
    'aggs': {
      'query_time_in_millis': {
        'max': {
          'field': 'indices_stats._all.total.search.query_time_in_millis'
        }
      },
      'query_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'query_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'query_total': {
        'max': {
          'field': 'indices_stats._all.total.search.query_total'
        }
      },
      'query_total_deriv': {
        'derivative': {
          'buckets_path': 'query_total',
          'gap_policy': 'skip'
        }
      }
    },
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'calculation': queryLatencyCalculation,
    'derivative': false,
    'description': 'The average search latency across the entire cluster.',
    'field': 'indices_stats._all.total.search.query_total',
    'format': '0,0.[00]',
    'label': 'Search Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'cluster_search_request_rate': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The cluster wide rate at which search reqeusts are being executed.',
    'field': 'indices_stats._all.total.search.query_total',
    'format': '0,0.[00]',
    'title': 'Search Rate',
    'label': 'Total Shards',
    'metricAgg': 'max',
    'type': 'cluster',
    'units': '/s'
  },
  'index_document_count': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total number of documents (in primary shards) for an index',
    'field': 'index_stats.primaries.docs.count',
    'format': '0,0.[0]a',
    'label': 'Document Count',
    'metricAgg': 'max',
    'type': 'index',
    'units': ''
  },
  'index_fielddata': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The amount of memory used by fielddata.',
    'field': 'index_stats.total.fielddata.memory_size_in_bytes',
    'format': '0,0.0 b',
    'label': 'Fielddata Size',
    'metricAgg': 'avg',
    'type': 'index',
    'units': 'B'
  },
  'index_latency': {
    'aggs': {
      'index_time_in_millis': {
        'max': {
          'field': 'index_stats.primaries.indexing.index_time_in_millis'
        }
      },
      'index_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'index_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'index_total': {
        'max': {
          'field': 'index_stats.primaries.indexing.index_total'
        }
      },
      'index_total_deriv': {
        'derivative': {
          'buckets_path': 'index_total',
          'gap_policy': 'skip'
        }
      }
    },
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'calculation': indexingLatencyCalculation,
    'derivative': false,
    'description': 'The average indexing latency across the entire cluster.',
    'field': 'index_stats.primaries.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Indexing Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'index_mem_doc_values': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Doc Values',
    'field': 'index_stats.total.segments.doc_values_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Doc Values',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_fielddata': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The amount of memory used by index fielddata.',
    'field': 'index_stats.total.fielddata.memory_size_in_bytes',
    'format': '0.0 b',
    'label': 'Fielddata',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_fixed_bit_set': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Nested Documents',
    'field': 'index_stats.total.segments.norms_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Fixed Bitsets',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_norms': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Norms',
    'field': 'index_stats.total.segments.norms_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Norms',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_overall': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used by open Lucene segment files',
    'field': 'index_stats.total.segments.memory_in_bytes',
    'format': '0.0 b',
    'label': 'Lucene Total',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_points': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Points (e.g., numerics and geo)',
    'field': 'index_stats.total.segments.points_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Points',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_stored_fields': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Stored Fields',
    'field': 'index_stats.total.segments.stored_fields_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Stored Fields',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_term_vectors': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Term Vectors',
    'field': 'index_stats.total.segments.term_vectors_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Term Vectors',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_terms': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Terms',
    'field': 'index_stats.total.segments.terms_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Terms',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_versions': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Versions',
    'field': 'index_stats.total.segments.version_map_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Version Map',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_writer': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Lucene Index Writers',
    'field': 'index_stats.total.segments.index_writer_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Index Writer',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_merge_rate': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The per index rate at which segements are being merged.',
    'field': 'index_stats.total.merges.total_size_in_bytes',
    'format': '0,0.[00]',
    'label': 'Indexing Rate',
    'metricAgg': 'max',
    'type': 'index',
    'units': '/s'
  },
  'index_refresh_time': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The the amount of time a refresh takes',
    'field': 'total.refresh.total_time_in_millis',
    'format': '0,0.[00]',
    'label': 'Total Refresh Time',
    'metricAgg': 'max',
    'type': 'index',
    'units': ''
  },
  'index_request_rate_primary': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The per index rate at which documents are being indexed.',
    'field': 'index_stats.primaries.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Primary Shards',
    'metricAgg': 'max',
    'title': 'Indexing Rate',
    'type': 'index',
    'units': '/s'
  },
  'index_request_rate_total': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The per index rate at which documents are being indexed.',
    'field': 'index_stats.total.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Total Shards',
    'metricAgg': 'max',
    'title': 'Indexing Rate',
    'type': 'index',
    'units': '/s'
  },
  'index_search_request_rate': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The per index rate at which search reqeusts are being executed.',
    'field': 'index_stats.total.search.query_total',
    'format': '0,0.[00]',
    'title': 'Search Rate',
    'label': 'Total Shards',
    'metricAgg': 'max',
    'type': 'index',
    'units': '/s'
  },
  'index_segment_count': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The average segment count.',
    'field': 'index_stats.total.segments.count',
    'format': '0,0.[00]',
    'label': 'Segment Count',
    'metricAgg': 'avg',
    'type': 'index',
    'units': ''
  },
  'index_shard_query_rate': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Total number of requests (GET /_search)across an index (and across all relevant shards for that index) / <time range>',
    'field': 'index_stats.total.search.query_total',
    'format': '0.[00]',
    'label': 'Index Shard Search Rate',
    'metricAgg': 'max',
    'type': 'index',
    'units': ''
  },
  'index_size': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The size of the index.',
    'field': 'index_stats.total.store.size_in_bytes',
    'format': '0,0.0 b',
    'label': 'Index Size',
    'metricAgg': 'avg',
    'type': 'index',
    'units': 'B'
  },
  'index_throttle_time': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The amount of load used for the last 1 minute.',
    'field': 'index_stats.primaries.indexing.throttle_time_in_millis',
    'format': '0,0.[00]',
    'label': 'Indexing Throttle Time',
    'metricAgg': 'max',
    'type': 'index',
    'units': 'ms'
  },
  'kibana_average_concurrent_connections': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The number of concurrent connections to the server',
    'field': 'kibana_stats.concurrent_connections',
    'format': '0.[00]',
    'label': 'Concurrent Connections',
    'metricAgg': 'max',
    'units': ''
  },
  'kibana_average_response_times': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The average request response time',
    'field': 'kibana_stats.response_times.average',
    'format': '0.[00]',
    'label': 'Average',
    'metricAgg': 'avg',
    'title': 'Response Time',
    'units': 'ms'
  },
  'kibana_max_response_times': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The max request response time',
    'field': 'kibana_stats.response_times.max',
    'format': '0.[00]',
    'label': 'Max',
    'metricAgg': 'avg',
    'title': 'Response Time',
    'units': 'ms'
  },
  'kibana_memory_heap_size_limit': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The limit of memory usage before garbage collection',
    'field': 'kibana_stats.process.memory.heap.size_limit',
    'format': '0,0.0 b',
    'label': 'Heap Size Limit',
    'metricAgg': 'max',
    'title': 'Memory Size',
    'units': 'B'
  },
  'kibana_memory_size': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The amount of memory in RAM used by the Kibana server process',
    'field': 'kibana_stats.process.memory.resident_set_size_in_bytes',
    'format': '0,0.0 b',
    'label': 'Memory Size',
    'metricAgg': 'avg',
    'title': 'Memory Size',
    'units': 'B'
  },
  'kibana_os_load_15m': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The the amount of time a refresh takes',
    'field': 'kibana_stats.os.load.15m',
    'format': '0,0.[00]',
    'label': '15m',
    'metricAgg': 'avg',
    'title': 'OS Load',
    'units': ''
  },
  'kibana_os_load_1m': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The the amount of time a refresh takes',
    'field': 'kibana_stats.os.load.1m',
    'format': '0,0.[00]',
    'label': '1m',
    'metricAgg': 'avg',
    'title': 'OS Load',
    'units': ''
  },
  'kibana_os_load_5m': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The the amount of time a refresh takes',
    'field': 'kibana_stats.os.load.5m',
    'format': '0,0.[00]',
    'label': '5m',
    'metricAgg': 'avg',
    'title': 'OS Load',
    'units': ''
  },
  'kibana_process_delay': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The Node event loop delay',
    'field': 'kibana_stats.process.event_loop_delay',
    'format': '0.[00]',
    'label': 'Event Loop Delay',
    'metricAgg': 'avg',
    'units': 'ms'
  },
  'kibana_requests': {
    'app': 'kibana',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'The number of requests received by the server',
    'field': 'kibana_stats.requests.total',
    'format': '0.[00]',
    'label': 'Requests',
    'metricAgg': 'sum',
    'units': ''
  },
  'node_cpu_utilization': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The percentage of CPU usage.',
    'field': 'node_stats.process.cpu.percent',
    'format': '0,0.[00]',
    'label': 'CPU Utilization',
    'metricAgg': 'avg',
    'type': 'node',
    'units': '%'
  },
  'node_free_space': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The free disk space available on the node',
    'field': 'node_stats.fs.total.available_in_bytes',
    'format': '0.0 b',
    'label': 'Disk Free Space',
    'metricAgg': 'max',
    'type': 'node',
    'units': ''
  },
  'node_index_latency': {
    'aggs': {
      'index_time_in_millis': {
        'max': {
          'field': 'node_stats.indices.indexing.index_time_in_millis'
        }
      },
      'index_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'index_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'index_total': {
        'max': {
          'field': 'node_stats.indices.indexing.index_total'
        }
      },
      'index_total_deriv': {
        'derivative': {
          'buckets_path': 'index_total',
          'gap_policy': 'skip'
        }
      },
    },
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'calculation': indexingLatencyCalculation,
    'derivative': false,
    'description': 'The average indexing latency',
    'field': 'node_stats.indices.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Indexing',
    'metricAgg': 'sum',
    'title': 'Latency',
    'type': 'node',
    'units': 'ms'
  },
  'node_index_mem_doc_values': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Doc Values',
    'field': 'node_stats.indices.segments.doc_values_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Doc Values',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_fielddata': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The amount of memory used by shard fielddata on this node.',
    'field': 'node_stats.indices.fielddata.memory_size_in_bytes',
    'format': '0.0 b',
    'label': 'Fielddata',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_fixed_bit_set': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Nested Documents',
    'field': 'node_stats.indices.segments.norms_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Fixed Bitsets',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_norms': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Norms',
    'field': 'node_stats.indices.segments.norms_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Norms',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_overall': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used by open Lucene segment files',
    'field': 'node_stats.indices.segments.memory_in_bytes',
    'format': '0.0 b',
    'label': 'Lucene Total',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_points': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Points (e.g., numerics and geo)',
    'field': 'node_stats.indices.segments.points_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Points',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_stored_fields': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Stored Fields',
    'field': 'node_stats.indices.segments.stored_fields_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Stored Fields',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_term_vectors': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Term Vectors',
    'field': 'node_stats.indices.segments.term_vectors_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Term Vectors',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_terms': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used in Lucene segments for Terms',
    'field': 'node_stats.indices.segments.terms_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Terms',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_versions': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Versions',
    'field': 'node_stats.indices.segments.version_map_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Version Map',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_writer': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Memory used for Lucene Index Writers',
    'field': 'node_stats.indices.segments.index_writer_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Index Writer',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_jvm_mem_percent': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The amound of heap used by the JVM',
    'field': 'node_stats.jvm.mem.heap_used_percent',
    'format': '0,0.[00]',
    'label': 'JVM Heap Usage',
    'metricAgg': 'avg',
    'type': 'node',
    'units': '%'
  },
  'node_load_average': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The amount of load used for the last 1 minute.',
    'field': 'node_stats.os.cpu.load_average.1m',
    'format': '0,0.[00]',
    'label': 'System Load Average',
    'metricAgg': 'avg',
    'type': 'node',
    'units': ''
  },
  'node_query_latency': {
    'aggs': {
      'query_time_in_millis': {
        'max': {
          'field': 'node_stats.indices.search.query_time_in_millis'
        }
      },
      'query_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'query_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'query_total': {
        'max': {
          'field': 'node_stats.indices.search.query_total'
        }
      },
      'query_total_deriv': {
        'derivative': {
          'buckets_path': 'query_total',
          'gap_policy': 'skip'
        }
      }
    },
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'calculation': queryLatencyCalculation,
    'derivative': false,
    'description': 'The average search latency',
    'field': 'node_stats.indices.search.query_total',
    'format': '0,0.[00]',
    'label': 'Search',
    'metricAgg': 'sum',
    'title': 'Latency',
    'type': 'node',
    'units': 'ms'
  },
  'node_segment_count': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'The average segment count.',
    'field': 'node_stats.indices.segments.count',
    'format': '0,0.[00]',
    'label': 'Segment Count',
    'metricAgg': 'avg',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_bulk': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Bulk thread queue. The number of bulk operations waiting to be processed.',
    'field': 'node_stats.thread_pool.bulk.queue',
    'format': '0.[00]',
    'label': 'Bulk',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_generic': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Generic thread queue. The number of internal, generic operations waiting to be processed.',
    'field': 'node_stats.thread_pool.generic.queue',
    'format': '0.[00]',
    'label': 'Generic',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_get': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Get thread queue. The number of get operations waiting to be processed.',
    'field': 'node_stats.thread_pool.get.queue',
    'format': '0.[00]',
    'label': 'Get',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_index': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Index thread queue. The number of index (not bulk) operations waiting to be processed.',
    'field': 'node_stats.thread_pool.index.queue',
    'format': '0.[00]',
    'label': 'Index',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_management': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Management thread queue. The number of internal management operations waiting to be processed.',
    'field': 'node_stats.thread_pool.management.queue',
    'format': '0.[00]',
    'label': 'Management',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_search': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Search thread queue. The number of search operations waiting to be processed.',
    'field': 'node_stats.thread_pool.search.queue',
    'format': '0.[00]',
    'label': 'Search',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_watcher': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Watcher thread queue. The number of Watcher operations waiting to be processed.',
    'field': 'node_stats.thread_pool.watcher.queue',
    'format': '0.[00]',
    'label': 'Watcher',
    'metricAgg': 'max',
    'title': 'Thread Pool Queues',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_bulk': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Bulk thread rejections. Rejections occur when the queue is full.',
    'field': 'node_stats.thread_pool.bulk.rejected',
    'format': '0.[00]',
    'label': 'Bulk',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_generic': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Generic thread rejections. Rejections occur when the queue is full.',
    'field': 'node_stats.thread_pool.generic.rejected',
    'format': '0.[00]',
    'label': 'Generic',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_get': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Get thread rejections. Rejections occur when the queue is full.',
    'field': 'node_stats.thread_pool.get.rejected',
    'format': '0.[00]',
    'label': 'Get',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_index': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Index thread rejections. Rejections occur when the queue is full. You should likely be using bulk!',
    'field': 'node_stats.thread_pool.index.rejected',
    'format': '0.[00]',
    'label': 'Index',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_management': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Management thread rejections. Rejections occur when the queue is full.',
    'field': 'node_stats.thread_pool.management.rejected',
    'format': '0.[00]',
    'label': 'Management',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_search': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Search thread rejections. Rejections occur when the queue is full.',
    'field': 'node_stats.thread_pool.search.rejected',
    'format': '0.[00]',
    'label': 'Search',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_watcher': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Watcher thread rejections. Rejections occur when the queue is full.',
    'field': 'node_stats.thread_pool.watcher.rejected',
    'format': '0.[00]',
    'label': 'Watcher',
    'metricAgg': 'max',
    'title': 'Thread Pool Rejections',
    'type': 'node',
    'units': ''
  },
  'query_latency': {
    'aggs': {
      'query_time_in_millis': {
        'max': {
          'field': 'index_stats.total.search.query_time_in_millis'
        }
      },
      'query_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'query_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'query_total': {
        'max': {
          'field': 'index_stats.total.search.query_total'
        }
      },
      'query_total_deriv': {
        'derivative': {
          'buckets_path': 'query_total',
          'gap_policy': 'skip'
        }
      }
    },
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'calculation': queryLatencyCalculation,
    'derivative': false,
    'description': 'The average search latency across the entire cluster.',
    'field': 'index_stats.total.search.query_total',
    'format': '0,0.[00]',
    'label': 'Search Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'search_request_rate': {
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'The cluster wide rate at which search reqeusts are being executed.',
    'field': 'index_stats.total.search.query_total',
    'format': '0,0.[00]',
    'title': 'Search Rate',
    'label': 'Total Shards',
    'metricAgg': 'max',
    'type': 'cluster',
    'units': '/s'
  },
  'node_index_mem_request_cache': {
    'field': 'node_stats.indices.request_cache.memory_size_in_bytes',
    'label': 'Request Cache',
    'description': 'The amount of memory used by the request cache.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_query_cache': {
    'field': 'index_stats.total.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'The amount of memory used by the query cache.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_query_cache': {
    'field': 'node_stats.indices.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'The amount of memory used by the query cache.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_request_cache': {
    'field': 'index_stats.total.request_cache.memory_size_in_bytes',
    'label': 'Request Cache',
    'description': 'The amount of memory used by the request cache.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'timestampField': 'timestamp',
    'derivative': false
  },
};

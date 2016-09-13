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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'calculation': indexingLatencyCalculation,
    'derivative': false,
    'description': 'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. This only considers primary shards.', // eslint-disable-line max-len
    'field': 'indices_stats._all.primaries.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Indexing Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'cluster_index_request_rate_primary': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of documents being indexed for primary shards.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of documents being indexed for primary and replica shards.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'calculation': queryLatencyCalculation,
    'derivative': false,
    'description': 'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. This considers primary and replica shards.', // eslint-disable-line max-len
    'field': 'indices_stats._all.total.search.query_total',
    'format': '0,0.[00]',
    'label': 'Search Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'cluster_search_request_rate': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total number of documents, only including primary shards.',
    'field': 'index_stats.primaries.docs.count',
    'format': '0,0.[0]a',
    'label': 'Document Count',
    'metricAgg': 'max',
    'type': 'index',
    'units': ''
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'calculation': indexingLatencyCalculation,
    'derivative': false,
    'description': 'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. This only considers primary shards.', // eslint-disable-line max-len
    'field': 'index_stats.primaries.indexing.index_total',
    'format': '0,0.[00]',
    'label': 'Indexing Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'index_mem_doc_values': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Doc Values. This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Fielddata (e.g., global ordinals or explicitly enabled fielddata on text fields). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Fixed Bit Sets (e.g., deeply nested documents). This is a part of Lucene Total.',
    'field': 'index_stats.total.segments.fixed_bit_set_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Fixed Bitsets',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'index',
    'units': 'B'
  },
  'index_mem_norms': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Points (e.g., numbers, IPs, and geo data). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Term Vectors. This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Terms (e.g., text). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Versioning (e.g., updates and deletes). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by the Index Writer. This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Amount in bytes of merged segments. Larger numbers indicate heavier disk activity.',
    'field': 'index_stats.total.merges.total_size_in_bytes',
    'format': '0,0.[00]',
    'label': 'Merge Rate',
    'metricAgg': 'max',
    'type': 'index',
    'units': '/s'
  },
  'index_refresh_time': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Time spent on Elasticsearch refresh for primary and replica shards.',
    'field': 'total.refresh.total_time_in_millis',
    'format': '0,0.[00]',
    'label': 'Total Refresh Time',
    'metricAgg': 'max',
    'type': 'index',
    'units': ''
  },
  'index_request_rate_primary': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of documents being indexed for primary shards.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of documents being indexed for primary and replica shards.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Average segment count for primary and replica shards.',
    'field': 'index_stats.total.segments.count',
    'format': '0,0.[00]',
    'label': 'Segment Count',
    'metricAgg': 'avg',
    'type': 'index',
    'units': ''
  },
  'index_size': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Size of the index on disk for primary and replica shards.',
    'field': 'index_stats.total.store.size_in_bytes',
    'format': '0,0.0 b',
    'label': 'Index Size',
    'metricAgg': 'avg',
    'type': 'index',
    'units': 'B'
  },
  'index_throttle_time': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Amount of time spent with index throttling, which indicates slow merging.',
    'field': 'index_stats.primaries.indexing.throttle_time_in_millis',
    'format': '0,0.[00]',
    'label': 'Index Throttling',
    'metricAgg': 'max',
    'type': 'index',
    'units': 'ms'
  },
  'kibana_average_concurrent_connections': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Total number of open socket connections to the Kibana instance.',
    'field': 'kibana_stats.concurrent_connections',
    'format': '0.[00]',
    'label': 'HTTP Connections',
    'metricAgg': 'max',
    'units': ''
  },
  'kibana_average_response_times': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Average response time for client requests to the Kibana instance.',
    'field': 'kibana_stats.response_times.average',
    'format': '0.[00]',
    'label': 'Average',
    'metricAgg': 'avg',
    'title': 'Client Response Time',
    'units': 'ms'
  },
  'kibana_max_response_times': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Maximum response time for client requests to the Kibana instance.',
    'field': 'kibana_stats.response_times.max',
    'format': '0.[00]',
    'label': 'Max',
    'metricAgg': 'avg',
    'title': 'Client Response Time',
    'units': 'ms'
  },
  'kibana_memory_heap_size_limit': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Limit of memory usage before garbage collection.',
    'field': 'kibana_stats.process.memory.heap.size_limit',
    'format': '0,0.0 b',
    'label': 'Heap Size Limit',
    'metricAgg': 'max',
    'title': 'Memory Size',
    'units': 'B'
  },
  'kibana_memory_size': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Total heap used by Kibana running in Node.js.',
    'field': 'kibana_stats.process.memory.resident_set_size_in_bytes',
    'format': '0,0.0 b',
    'label': 'Memory Size',
    'metricAgg': 'avg',
    'title': 'Memory Size',
    'units': 'B'
  },
  'kibana_os_load_15m': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Load average over the last 15 minutes.',
    'field': 'kibana_stats.os.load.15m',
    'format': '0,0.[00]',
    'label': '15m',
    'metricAgg': 'avg',
    'title': 'System Load',
    'units': ''
  },
  'kibana_os_load_1m': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Load average over the last minute.',
    'field': 'kibana_stats.os.load.1m',
    'format': '0,0.[00]',
    'label': '1m',
    'metricAgg': 'avg',
    'title': 'System Load',
    'units': ''
  },
  'kibana_os_load_5m': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Load average over the last 5 minutes.',
    'field': 'kibana_stats.os.load.5m',
    'format': '0,0.[00]',
    'label': '5m',
    'metricAgg': 'avg',
    'title': 'System Load',
    'units': ''
  },
  'kibana_process_delay': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Delay in Kibana server event loops. Longer delays may indicate blocking events in server thread, such as synchronous functions taking large amount of CPU time.', // eslint-disable-line max-len
    'field': 'kibana_stats.process.event_loop_delay',
    'format': '0.[00]',
    'label': 'Event Loop Delay',
    'metricAgg': 'avg',
    'units': 'ms'
  },
  'kibana_requests': {
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false,
    'description': 'Total number of client requests received by the Kibana instance.',
    'field': 'kibana_stats.requests.total',
    'format': '0.[00]',
    'label': 'Client Requests',
    'metricAgg': 'sum',
    'units': ''
  },
  'node_cpu_utilization': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Percentage of CPU usage (100% is the max).',
    'field': 'node_stats.process.cpu.percent',
    'format': '0,0.[00]',
    'label': 'CPU Utilization',
    'metricAgg': 'avg',
    'type': 'node',
    'units': '%'
  },
  'node_free_space': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Free disk space available on the node.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'calculation': indexingLatencyCalculation,
    'derivative': false,
    'description': 'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. This considers any shard located on this node, including replicas.', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Doc Values. This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Fielddata (e.g., global ordinals or explicitly enabled fielddata on text fields). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Fixed Bit Sets (e.g., deeply nested documents). This is a part of Lucene Total.',
    'field': 'node_stats.indices.segments.fixed_bit_set_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Fixed Bitsets',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_index_mem_norms': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards on this node.', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Points (e.g., numbers, IPs, and geo data). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Term Vectors. This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Terms (e.g., text). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by Versioning (e.g., updates and deletes). This is a part of Lucene Total.',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Heap memory used by the Index Writer. This is a part of Lucene Total.',
    'field': 'node_stats.indices.segments.index_writer_memory_in_bytes',
    'format': '0.0 b',
    'label': 'Index Writer',
    'metricAgg': 'max',
    'title': 'Index Memory',
    'type': 'node',
    'units': 'B'
  },
  'node_jvm_mem_max_in_bytes': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total heap available to Elasticsearch running in the JVM.',
    'field': 'node_stats.jvm.mem.heap_max_in_bytes',
    'format': '0.0 b',
    'title': 'JVM Heap',
    'label': 'Max Heap',
    'metricAgg': 'max',
    'type': 'node',
    'units': 'B'
  },
  'node_jvm_mem_used_in_bytes': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total heap used by Elasticsearch running in the JVM.',
    'field': 'node_stats.jvm.mem.heap_used_in_bytes',
    'format': '0.0 b',
    'title': 'JVM Heap',
    'label': 'Used Heap',
    'metricAgg': 'max',
    'type': 'node',
    'units': 'B'
  },
  'node_jvm_mem_percent': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Total heap used by Elasticsearch running in the JVM.',
    'field': 'node_stats.jvm.mem.heap_used_percent',
    'format': '0,0.[00]',
    'title': 'JVM Heap',
    'label': 'Used Heap',
    'metricAgg': 'max',
    'type': 'node',
    'units': '%'
  },
  'node_load_average': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Load average over the last minute.',
    'field': 'node_stats.os.cpu.load_average.1m',
    'format': '0,0.[00]',
    'title': 'System Load',
    'label': '1m',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'calculation': queryLatencyCalculation,
    'derivative': false,
    'description': 'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. This considers primary and replica shards.', // eslint-disable-line max-len
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Average segment count for primary and replica shards on this node.',
    'field': 'node_stats.indices.segments.count',
    'format': '0,0.[00]',
    'label': 'Segment Count',
    'metricAgg': 'avg',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_bulk': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of bulk indexing operations waiting to be processed on this node. A single bulk request can create multiple bulk operations.', // eslint-disable-line max-len
    'field': 'node_stats.thread_pool.bulk.queue',
    'format': '0.[00]',
    'label': 'Bulk',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_generic': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of generic (internal) operations waiting to be processed on this node.',
    'field': 'node_stats.thread_pool.generic.queue',
    'format': '0.[00]',
    'label': 'Generic',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_get': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of get operations waiting to be processed on this node.',
    'field': 'node_stats.thread_pool.get.queue',
    'format': '0.[00]',
    'label': 'Get',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_index': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of non-bulk, index operations waiting to be processed on this node.',
    'field': 'node_stats.thread_pool.index.queue',
    'format': '0.[00]',
    'label': 'Index',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_management': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of management (internal) operations waiting to be processed on this node.',
    'field': 'node_stats.thread_pool.management.queue',
    'format': '0.[00]',
    'label': 'Management',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_search': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of search operations waiting to be processed on this node. A single search request can create multiple search operations.', // eslint-disable-line max-len
    'field': 'node_stats.thread_pool.search.queue',
    'format': '0.[00]',
    'label': 'Search',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_queued_watcher': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'description': 'Number of Watcher operations waiting to be processed on this node.',
    'field': 'node_stats.thread_pool.watcher.queue',
    'format': '0.[00]',
    'label': 'Watcher',
    'metricAgg': 'max',
    'title': 'Thread Queue',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_bulk': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Bulk rejections. These occur when the queue is full.',
    'field': 'node_stats.thread_pool.bulk.rejected',
    'format': '0.[00]',
    'label': 'Bulk',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_generic': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Generic (internal) rejections. These occur when the queue is full.',
    'field': 'node_stats.thread_pool.generic.rejected',
    'format': '0.[00]',
    'label': 'Generic',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_get': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Get rejections. These occur when the queue is full.',
    'field': 'node_stats.thread_pool.get.rejected',
    'format': '0.[00]',
    'label': 'Get',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_index': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Index rejections. These occur when the queue is full. You should look at bulk indexing.',
    'field': 'node_stats.thread_pool.index.rejected',
    'format': '0.[00]',
    'label': 'Index',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_management': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Get (internal) rejections. These occur when the queue is full.',
    'field': 'node_stats.thread_pool.management.rejected',
    'format': '0.[00]',
    'label': 'Management',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_search': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Search rejections. These occur when the queue is full. This can indicate over-sharding.',
    'field': 'node_stats.thread_pool.search.rejected',
    'format': '0.[00]',
    'label': 'Search',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
    'type': 'node',
    'units': ''
  },
  'node_threads_rejected_watcher': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Watch rejections. These occur when the queue is full. This can indicate stuck-Watches.',
    'field': 'node_stats.thread_pool.watcher.rejected',
    'format': '0.[00]',
    'label': 'Watcher',
    'metricAgg': 'max',
    'title': 'Thread Rejections',
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
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'calculation': queryLatencyCalculation,
    'derivative': false,
    'description': 'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. This considers primary and replica shards.', // eslint-disable-line max-len
    'field': 'index_stats.total.search.query_total',
    'format': '0,0.[00]',
    'label': 'Search Latency',
    'metricAgg': 'sum',
    'type': 'cluster',
    'units': 'ms'
  },
  'search_request_rate': {
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true,
    'description': 'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!', // eslint-disable-line max-len
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
    'description': 'Heap memory used by Request Cache (e.g., instant aggregations). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_query_cache': {
    'field': 'index_stats.total.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_query_cache': {
    'field': 'node_stats.indices.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_request_cache': {
    'field': 'index_stats.total.request_cache.memory_size_in_bytes',
    'label': 'Request Cache',
    'description': 'Heap memory used by Request Cache (e.g., instant aggregations). This is for the same shards, but not a part of Lucene Total.', // eslint-disable-line max-len
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
};

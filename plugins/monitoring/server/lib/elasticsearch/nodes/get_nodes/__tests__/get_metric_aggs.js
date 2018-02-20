import expect from 'expect.js';
import { getMetricAggs } from '../get_metric_aggs';

describe('get metric aggs', () => {
  it('creates aggregations for "basic" metrics', () => {
    const listingMetrics = [
      'node_cpu_utilization',
      'node_jvm_mem_percent'
    ];
    const bucketSize = 30;

    expect(getMetricAggs(listingMetrics, bucketSize)).to.eql({
      node_cpu_utilization: {
        date_histogram: {
          field: 'timestamp',
          min_doc_count: 1,
          interval: '30s'
        },
        aggs: {
          metric: { max: { field: 'node_stats.process.cpu.percent' } },
          metric_deriv: {
            derivative: { buckets_path: 'metric', unit: '1s' }
          }
        }
      },
      node_jvm_mem_percent: {
        date_histogram: {
          field: 'timestamp',
          min_doc_count: 1,
          interval: '30s'
        },
        aggs: {
          metric: { max: { field: 'node_stats.jvm.mem.heap_used_percent' } },
          metric_deriv: {
            derivative: { buckets_path: 'metric', unit: '1s' }
          }
        }
      }
    });
  });

  it('incorporates a metric custom aggs', () => {
    const listingMetrics = [
      'node_index_latency',
      'node_query_latency'
    ];
    const bucketSize = 30;

    expect(getMetricAggs(listingMetrics, bucketSize)).to.eql({
      node_index_latency: {
        date_histogram: { field: 'timestamp', min_doc_count: 1, interval: '30s' },
        aggs: {
          index_time_in_millis: {
            max: { field: 'node_stats.indices.indexing.index_time_in_millis' }
          },
          index_total: {
            max: { field: 'node_stats.indices.indexing.index_total' }
          },
          index_time_in_millis_deriv: {
            derivative: { buckets_path: 'index_time_in_millis', gap_policy: 'skip' }
          },
          index_total_deriv: {
            derivative: { buckets_path: 'index_total', gap_policy: 'skip' }
          }
        }
      },
      node_query_latency: {
        date_histogram: { field: 'timestamp', min_doc_count: 1, interval: '30s' },
        aggs: {
          query_time_in_millis: {
            max: { field: 'node_stats.indices.search.query_time_in_millis' }
          },
          query_total: { max: { field: 'node_stats.indices.search.query_total' } },
          query_time_in_millis_deriv: {
            derivative: { buckets_path: 'query_time_in_millis', gap_policy: 'skip' }
          },
          query_total_deriv: {
            derivative: { buckets_path: 'query_total', gap_policy: 'skip' }
          }
        }
      }
    });
  });
});

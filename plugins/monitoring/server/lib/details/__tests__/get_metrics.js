import { getMetrics } from '../get_metrics';
import sinon from 'sinon';
import expect from 'expect.js';
import nonDerivMetricsBuckets from './fixtures/non_deriv_metrics_buckets';
import nonDerivMetricsResults from './fixtures/non_deriv_metrics_results';

import derivMetricsBuckets from './fixtures/deriv_metrics_buckets';
import derivMetricsResults from './fixtures/deriv_metrics_results';

import aggMetricsBuckets from './fixtures/agg_metrics_buckets';
import aggMetricsResults from './fixtures/agg_metrics_results';

// max / min window that accepts the above buckets/results
const min = 1498968000000; // 2017-07-02T04:00:00.000Z
const max = 1499054399999; // 2017-07-03T03:59:59.999Z

function getMockReq(metricsBuckets = [], payloadMetrics = []) {
  const config = {
    get: sinon.stub()
  };

  config.get.withArgs('xpack.monitoring.min_interval_seconds').returns(10);

  return {
    server: {
      config() {
        return config;
      },
      plugins: {
        elasticsearch: {
          getCluster: sinon.stub().withArgs('monitoring').returns({
            callWithRequest: sinon.stub().returns(Promise.resolve({
              aggregations: {
                check: {
                  buckets: metricsBuckets
                }
              }
            }))
          })
        }
      }
    },
    payload: {
      metrics: payloadMetrics,
      timeRange: { min, max }
    },
    params: {
      clusterUuid: '1234xyz'
    }
  };
}

const indexPattern = [];

describe('getMetrics and getSeries', () => {

  it('with non-derivative metric', () => {
    const req = getMockReq(nonDerivMetricsBuckets, [ 'node_cpu_utilization' ]);
    return getMetrics(req, indexPattern)
    .then(result => {
      expect(result).to.eql({
        node_cpu_utilization: [
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: 'Percentage of CPU usage reported by the OS (100% is the max).',
              field: 'node_stats.process.cpu.percent',
              label: 'CPU Utilization',
              format: '0,0.[00]',
              units: '%'
            },
            data: nonDerivMetricsResults
          }
        ]
      });
    });
  });

  it('with derivative metric', () => {
    const req = getMockReq(derivMetricsBuckets, [ 'cluster_search_request_rate' ]);
    return getMetrics(req, indexPattern)
    .then(result => {
      expect(result).to.eql({
        cluster_search_request_rate: [
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: (
                'Number of search requests being executed across primary and ' +
                'replica shards. A single search can run against multiple ' +
                'shards!'
              ),
              field: 'indices_stats._all.total.search.query_total',
              label: 'Total Shards',
              title: 'Search Rate',
              format: '0,0.[00]',
              units: '/s'
            },
            data: derivMetricsResults
          }
        ]
      });
    });
  });

  it('with metric containing custom aggs', () => {
    const req = getMockReq(aggMetricsBuckets, [ 'cluster_index_latency' ]);
    return getMetrics(req, indexPattern)
    .then(result => {
      expect(result).to.eql({
        cluster_index_latency: [
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: (
                'Average latency for indexing documents, which is time it takes ' +
                'to index documents divided by number that were indexed. ' +
                'This only considers primary shards.'
              ),
              field: 'indices_stats._all.primaries.indexing.index_total',
              label: 'Indexing Latency',
              format: '0,0.[00]',
              units: 'ms'
            },
            data: aggMetricsResults
          }
        ]
      });
    });
  });

  it('with object structure for metric', () => {
    const req = getMockReq(nonDerivMetricsBuckets, [
      {
        name: 'index_1',
        keys: [
          'index_mem_overall_1',
          'index_mem_stored_fields',
          'index_mem_doc_values',
          'index_mem_norms'
        ]
      }
    ]);
    return getMetrics(req, indexPattern)
    .then(result => {
      expect(result).to.eql({
        index_1: [
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: (
                'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.'
              ),
              field: 'index_stats.total.segments.memory_in_bytes',
              label: 'Lucene Total',
              title: 'Index Memory - Lucene 1',
              format: '0.0 b',
              units: 'B'
            },
            data: nonDerivMetricsResults
          },
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: (
                'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.'
              ),
              field: 'index_stats.total.segments.stored_fields_memory_in_bytes',
              label: 'Stored Fields',
              title: 'Index Memory',
              format: '0.0 b',
              units: 'B'
            },
            data: nonDerivMetricsResults
          },
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: (
                'Heap memory used by Doc Values. This is a part of Lucene Total.'
              ),
              field: 'index_stats.total.segments.doc_values_memory_in_bytes',
              label: 'Doc Values',
              title: 'Index Memory',
              format: '0.0 b',
              units: 'B'
            },
            data: nonDerivMetricsResults
          },
          {
            timeRange: { min, max },
            metric: {
              app: 'elasticsearch',
              description: (
                'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.'
              ),
              field: 'index_stats.total.segments.norms_memory_in_bytes',
              label: 'Norms',
              title: 'Index Memory',
              format: '0.0 b',
              units: 'B'
            },
            data: nonDerivMetricsResults
          }
        ]
      });
    });
  });

  it('with metric that uses default calculation', () => {
    const req = getMockReq(nonDerivMetricsBuckets, [ 'kibana_max_response_times' ]);
    return getMetrics(req, indexPattern)
    .then(result => {
      expect(result).to.eql({
        kibana_max_response_times: [
          {
            timeRange: { min, max },
            metric: {
              app: 'kibana',
              description: 'Maximum response time for client requests to the Kibana instance.',
              field: 'kibana_stats.response_times.max',
              label: 'Max',
              title: 'Client Response Time',
              format: '0.[00]',
              units: 'ms'
            },
            data: nonDerivMetricsResults
          }
        ]
      });
    });
  });

});

import { metrics, LatencyMetric } from '../';
import expect from 'expect.js';
import _ from 'lodash';
import { Model } from './model';
import { expected } from './metrics_fixture';

describe('Metrics', () => {
  const flatMetrics = Model.flatten(metrics);
  const flatExpected = Model.flatten(expected);

  it('All expected keys match', () => {
    const metricsKeys = Object.keys(flatMetrics).sort();
    const expectedKeys = Object.keys(flatExpected).sort();
    expect(metricsKeys).to.be.eql(expectedKeys);
  });

  /*eslint-disable guard-for-in, no-loop-func*/
  for (const metricType of ['query', 'index']) {
    const latencyMetric = new LatencyMetric({
      metric: metricType,
      field: metricType,
      fieldSource: 'test_type',
      label: `Test ${metricType} Latency Metric`,
      description: `Testing ${metricType} Latency with negative derivatives`,
      type: 'cluster',
      test_derivatives: [
        // both negative
        {
          [`${metricType}_time_in_millis_deriv`]: { value: -42 },
          [`${metricType}_total_deriv`]: { value: -6 }
        },
        // one negative
        {
          [`${metricType}_time_in_millis_deriv`]: { value: 42 },
          [`${metricType}_total_deriv`]: { value: -6 }
        },
        // other negative
        {
          [`${metricType}_time_in_millis_deriv`]: { value: -42 },
          [`${metricType}_total_deriv`]: { value: 6 }
        }
      ]
    });

    for (const derivative of latencyMetric.test_derivatives) {
      it(`LatencyMetric ${metricType} returns null for negative derivative values`, () => {
        expect(latencyMetric.calculation(derivative)).to.be.eql(null);
      });
    }
  }

  for (const metric in flatMetrics) {
    if (!_.isFunction(flatMetrics[metric])) {
      it(`Metric ${metric} value matches expected`, () => {
        expect(flatMetrics[metric]).to.be.eql(flatExpected[metric]);
      });
    }
  }

  for (const metric in flatMetrics) {
    if (_.isFunction(flatMetrics[metric])) {
      it(`Metric ${metric} function matches expected`, () => {
        const metricsFunction = flatMetrics[metric];
        const expectedFunction = flatExpected[metric];

        const indexingObject = {
          index_time_in_millis_deriv: {
            value: 42
          },
          index_total_deriv: {
            value: 6
          }
        };
        const queryingObject = {
          query_time_in_millis_deriv: {
            value: 48
          },
          query_total_deriv: {
            value: 6
          }
        };
        const failObject = {
          fail: true
        };
        const logstashPipelineThroughputObject = {
          pipelines_nested: {
            by_pipeline_id: {
              buckets: [
                {
                  key: 'main',
                  throughput: {
                    value: 12345
                  }
                }
              ]
            }
          }
        };
        const logstashPipelineNodesCountObject = {
          pipelines_nested: {
            by_pipeline_id: {
              buckets: [
                {
                  key: 'main',
                  to_root: {
                    node_count: {
                      value: 3
                    }
                  }
                }
              ]
            }
          }
        };

        const metricsIndexingDerivResult = metricsFunction(indexingObject);
        const expectedIndexingDeriveResult = expectedFunction(indexingObject);
        expect(metricsIndexingDerivResult).to.be.eql(expectedIndexingDeriveResult);

        const metricsQueryingDerivResult = metricsFunction(queryingObject);
        const expectedQueryingDeriveResult = expectedFunction(queryingObject);
        expect(metricsQueryingDerivResult).to.be.eql(expectedQueryingDeriveResult);

        const metricsFailResult = metricsFunction(failObject);
        const expectedFailResult = expectedFunction(failObject);
        expect(metricsFailResult).to.be.eql(expectedFailResult);

        const metricsLogstashPipelineThroughputResult = metricsFunction(logstashPipelineThroughputObject, undefined, undefined, 10);
        const expectedLogstashPipelineThroughputResult = expectedFunction(logstashPipelineThroughputObject, undefined, undefined, 10);
        expect(metricsLogstashPipelineThroughputResult).to.be.eql(expectedLogstashPipelineThroughputResult);

        const metricsLogstashPipelineNodesCountResult = metricsFunction(logstashPipelineNodesCountObject);
        const expectedLogstashPipelineNodesCountResult = expectedFunction(logstashPipelineNodesCountObject);
        expect(metricsLogstashPipelineNodesCountResult).to.be.eql(expectedLogstashPipelineNodesCountResult);
      });
    }
  }
  /*eslint-enable*/
});

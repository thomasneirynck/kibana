import expect from 'expect.js';
import { isFunction } from 'lodash';
import { metrics, LatencyMetric } from '../';
import { Model } from './model';
import { expected } from './metrics_fixture';

describe('Metrics', () => {

  const flatMetrics = Model.flatten(metrics);
  const flatExpected = Model.flatten(expected);

  it('All metric keys match expected', () => {
    const metricsKeys = Object.keys(flatMetrics).sort();
    const expectedKeys = Object.keys(flatExpected).sort();
    expect(metricsKeys).to.be.eql(expectedKeys);
  });

  for (const metric in flatMetrics) {
    if (!isFunction(flatMetrics[metric])) {
      it(`Metric ${metric} value matches expected`, () => {
        expect(flatMetrics[metric]).to.be.eql(flatExpected[metric]);
      });
    } else {
      it(`Metric ${metric} function type matches function`, () => {
        const metricsFunction = flatMetrics[metric];
        expect(metricsFunction).to.be.a('function');
      });
    }
  }

  describe('Query/Index Metric derivative calculations that return null', () => {

    const getLatencyMetric = metricType => {
      return new LatencyMetric({
        metric: metricType,
        field: metricType,
        fieldSource: 'test_type',
        label: `Test ${metricType} Latency Metric`,
        description: `Testing ${metricType} Latency with negative derivatives`,
        type: 'cluster',
      });
    };

    it(`LatencyMetrics return null if time and total are both negative`, () => {
      const queryDerivative = {
        [`query_time_in_millis_deriv`]: { value: -42 },
        [`query_total_deriv`]: { value: -6 }
      };
      expect(getLatencyMetric('query').calculation(queryDerivative)).to.be.eql(null);

      const indexDerivative = {
        [`index_time_in_millis_deriv`]: { value: -42 },
        [`index_total_deriv`]: { value: -6 }
      };
      expect(getLatencyMetric('index').calculation(indexDerivative)).to.be.eql(null);
    });

    it(`LatencyMetrics return null if total is negative`, () => {
      const queryDerivative = {
        [`query_time_in_millis_deriv`]: { value: 42 },
        [`query_total_deriv`]: { value: -6 }
      };
      expect(getLatencyMetric('query').calculation(queryDerivative)).to.be.eql(null);

      const indexDerivative = {
        [`index_time_in_millis_deriv`]: { value: 42 },
        [`index_total_deriv`]: { value: -6 }
      };
      expect(getLatencyMetric('index').calculation(indexDerivative)).to.be.eql(null);
    });

    it(`LatencyMetrics return null if time is negative`, () => {
      const queryDerivative = {
        [`query_time_in_millis_deriv`]: { value: -42 },
        [`query_total_deriv`]: { value: 6 }
      };
      expect(getLatencyMetric('query').calculation(queryDerivative)).to.be.eql(null);

      const indexDerivative = {
        [`index_time_in_millis_deriv`]: { value: -42 },
        [`index_total_deriv`]: { value: 6 }
      };
      expect(getLatencyMetric('index').calculation(indexDerivative)).to.be.eql(null);
    });

  });

});

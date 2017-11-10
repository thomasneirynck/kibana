import expect from 'expect.js';
import { QuotaMetric } from '..';

describe('Quota Metric Calculation', () => {
  it('When bucket is invalid, returns undefined', () => {
    const myQuotaMetric = new QuotaMetric({
      field: 'cpu_field',
      label: 'cpu_label',
      description: 'cpu_description',
      type: 'node',
      app: 'elasticsearch',
      uuidField: 'cluster_uuid',
      timestampField: 'timestamp'
    });
    expect(myQuotaMetric.calculation()).to.be(null);
  });

  it('When bucket has valid Δusage, Δperiods, and quota', () => {
    const myQuotaMetric = new QuotaMetric({
      field: 'cpu_field',
      label: 'cpu_label',
      description: 'cpu_description',
      type: 'node',
      app: 'elasticsearch',
      uuidField: 'cluster_uuid',
      timestampField: 'timestamp'
    });
    expect(myQuotaMetric.calculation({
      quota: { value: 10 },
      usage_deriv: { value: 1000 },
      periods_deriv: { value: 10 },
      metric: { value: Infinity } // is the val for normal CPU usage, won't be used
    })).to.be(1);
  });

  it('When bucket has not valid Δusage, Δperiods, and quota', () => {
    const myQuotaMetric = new QuotaMetric({
      field: 'cpu_field',
      label: 'cpu_label',
      description: 'cpu_description',
      type: 'node',
      app: 'elasticsearch',
      uuidField: 'cluster_uuid',
      timestampField: 'timestamp'
    });
    expect(myQuotaMetric.calculation({
      quota: { value: null },
      usage_deriv: { value: null },
      periods_deriv: { value: null },
      metric: { value: Infinity } // is the val for normal CPU usage, will be taken as return value
    })).to.be(null);
  });
});

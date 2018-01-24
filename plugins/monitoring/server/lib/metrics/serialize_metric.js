import { pick } from 'lodash';

export function serializeMetric(metric) {
  // some fields exposed for debugging through HTML comment text
  const pickFields = [
    'app',
    'field',
    'metricAgg',
    'label',
    'title',
    'description',
    'units',
    'format'
  ];

  return {
    ...pick(metric, pickFields),
    hasCalculation: Boolean(metric.calculation),
    isDerivative: metric.derivative,
  };
}

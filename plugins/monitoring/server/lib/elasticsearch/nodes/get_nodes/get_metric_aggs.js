import { metrics } from '../../../metrics';

/*
 * Create the DSL for date histogram aggregations based on an array of metric names
 * NOTE: Issue https://github.com/elastic/x-pack-kibana/issues/332 would be
 * addressed if chart data aggregations used a module like this
 *
 * @param {Array} listingMetrics: Array of metric names (See server/lib/metrics/metrics.js)
 * @param {Number} bucketSize: Bucket size in seconds for date histogram interval
 * @return {Object} Aggregation DSL
 */
export function getMetricAggs(listingMetrics, bucketSize) {
  const aggItems = {};

  listingMetrics.forEach(metricName => {
    const metric = metrics[metricName];
    let metricAgg = null;

    if (!metric) {
      return;
    }

    if (!metric.aggs) { // if metric does not have custom agg defined
      metricAgg = {
        metric: {
          [metric.metricAgg]: { // max, sum, etc
            field: metric.field
          }
        },
        metric_deriv: {
          derivative: {
            buckets_path: 'metric',
            unit: '1s'
          }
        }
      };
    }

    aggItems[metricName] = {
      date_histogram: {
        field: 'timestamp',
        min_doc_count: 1,
        interval: bucketSize + 's'
      },
      aggs: metric.aggs || metricAgg
    };
  });

  return aggItems;
}

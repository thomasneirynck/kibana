import { get } from 'lodash';
import moment from 'moment';
import { checkParam } from '../error_missing_required';
import { metrics } from '../metrics';
import { createQuery } from '../create_query.js';
import { near } from '../calculate_auto';
import { filterPartialBuckets } from '../filter_partial_buckets';
import { pickMetricFields } from '../pick_metric_fields';

// Use the metric object as the source of truth on where to find the UUID
function getUuid(req, metric) {
  if (metric.app === 'kibana') {
    return req.params.kibanaUuid;
  } else if (metric.app === 'logstash') {
    return req.params.logstashUuid;
  }
  return req.params.clusterUuid;
}

function defaultCalculation(key, metric, bucketSize, bucket) {
  // TODO: get(bucket, `${key}.value`, null); avoid fake zeroes!
  let value =  bucket[key] && bucket[key].value || 0;
  // convert metric_deriv from the bucket size to seconds if units == '/s'
  if (metric.units === '/s') {
    value = value / bucketSize;
  }
  // negatives suggest derivatives that have been reset (usually due to restarts that reset the count)
  return Math.max(value, 0);
}

function createMetricAggs(metric) {
  if (metric.derivative) {
    return {
      metric_deriv: {
        derivative: { buckets_path: 'metric', gap_policy: 'skip' }
      },
      ...metric.aggs
    };
  }

  return metric.aggs;
}

/**
 * Calculate the series (aka, time-plotted) values for a single metric.
 *
 * TODO: This should be expanded to accept multiple metrics in a single request to allow a single date histogram to be used.
 *
 * @param {Object} req The incoming user's request.
 * @param {String} indexPattern The relevant index pattern (not just for Elasticsearch!).
 * @param {String} metricName The name of the metric being plotted.
 * @param {Array} filters Any filters that should be applied to the query.
 * @return {Promise} The object response containing the {@code timeRange}, {@code metric}, and {@code data}.
 */
export function getSeries(req, indexPattern, metricName, filters) {
  const config = req.server.config();
  const minIntervalSeconds = config.get('xpack.monitoring.min_interval_seconds');
  // TODO: Pass in req parameters as explicit function parameters
  const min = moment.utc(req.payload.timeRange.min).valueOf();
  const max = moment.utc(req.payload.timeRange.max).valueOf();
  const duration = moment.duration(max - min, 'ms');
  const bucketSize = Math.max(minIntervalSeconds, near(100, duration).asSeconds());

  const metric = metrics[metricName];

  return fetchSeries(req, indexPattern, metric, min, max, bucketSize, filters)
  .then(response => handleSeries(metric, min, max, bucketSize, response));
}

function fetchSeries(req, indexPattern, metric, min, max, bucketSize, filters) {
  checkParam(indexPattern, 'indexPattern in details/getSeries');

  const metricAggs = createMetricAggs(metric);
  const params = {
    index: indexPattern,
    size: 0,
    ignoreUnavailable: true,
    body: {
      query: createQuery({
        start: min,
        end: max,
        metric,
        // TODO: Pass in the UUID as an explicit function parameter
        uuid: getUuid(req, metric),
        filters
      }),
      aggs: {
        check: {
          date_histogram: {
            field: metric.timestampField,
            interval: bucketSize + 's'
          },
          aggs: {
            metric: {
              [metric.metricAgg]: {
                field: metric.field
              }
            },
            ...metricAggs
          }
        }
      }
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params);
}

function handleSeries(metric, min, max, bucketSize, response) {
  // skip irrelevant buckets
  const bucketFilter = filterPartialBuckets(min, max, bucketSize);

  // map buckets to values for charts
  const key = metric.derivative ? 'metric_deriv' : 'metric';
  const metricDefaultCalculation = (bucket) => defaultCalculation(key, metric, bucketSize, bucket);
  const bucketMapper = metric && metric.calculation || metricDefaultCalculation;

  const buckets = get(response, 'aggregations.check.buckets', []);

  return {
    timeRange: { min, max },
    metric: pickMetricFields(metric),
    // map buckets to X/Y coords for Flot charting
    data: buckets.filter(bucketFilter).map(bucket => [ bucket.key, bucketMapper(bucket) ])
  };
}

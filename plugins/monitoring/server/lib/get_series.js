const _ = require('lodash');
const moment = require('moment');
const metrics = require('./metrics');
const createQuery = require('./create_query.js');
const calcAuto = require('./calculate_auto');
const filterPartialBuckets = require('./filter_partial_buckets');
const pickMetricFields = require('./pick_metric_fields');

export default function getSeries(req, indices, metricName, filters) {
  const config = req.server.config();
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const metric = metrics[metricName];
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const clusterUuid = req.params.clusterUuid;
  const kibanaUuid = req.params.kibanaUuid;
  const minIntervalSeconds = config.get('xpack.monitoring.min_interval_seconds');

  const params = {
    index: indices,
    meta: `get_series-${metricName}`,
    size: 0,
    ignoreUnavailable: true,
    ignore: [404],
    body: {
      query: createQuery({ start, end, clusterUuid, kibanaUuid, filters }),
      aggs: {}
    }
  };
  const min = moment.utc(start).valueOf();
  const max = moment.utc(end).valueOf();
  const duration = moment.duration(max - min, 'ms');
  const bucketSize = Math.max(minIntervalSeconds, calcAuto.near(100, duration).asSeconds());
  const timestampField = kibanaUuid ?  'kibana_stats.timestamp' : 'timestamp';
  const aggs = {
    check: {
      date_histogram: {
        field: timestampField,
        min_doc_count: 0,
        interval: bucketSize + 's',
        extended_bounds: { min, max }
      },
      aggs: { metric: { } },
      meta: {
        timefilterMin: min,
        timefilterMax: max,
        bucketSize: bucketSize
      }
    }
  };
  aggs.check.aggs.metric[metric.metricAgg] = {
    field: metric.field
  };
  if (metric.derivative) {
    aggs.check.aggs.metric_deriv = {
      derivative: { buckets_path: 'metric', gap_policy: 'skip' }
    };
  }
  if (metric.aggs) {
    _.assign(aggs.check.aggs, metric.aggs);
  }
  params.body.aggs = aggs;
  return callWithRequest(req, 'search', params)
  .then(function (resp) {
    if (!resp.aggregations)  {
      // dead code here?
      return {
        metric: pickMetricFields(metric),
        data: []
      };
    }
    const aggCheck = resp.aggregations.check;
    const respBucketSize = aggCheck.meta.bucketSize;
    const key = (metric.derivative) ? 'metric_deriv' : 'metric';
    const defaultCalculation = (bucket) => {
      let value =  bucket[key] && bucket[key].value || 0;
      // convert metric_deriv from the bucket size to seconds if units == '/s'
      if (metric.units === '/s') {
        value = Math.max(value / respBucketSize, 0);
      }
      return value;
    };

    const calculationFn = metric && metric.calculation || defaultCalculation;
    function calculation(bucket) {
      if (bucket.doc_count > 0) {
        return calculationFn(bucket);
      }
      return null;
    }

    const buckets = aggCheck.buckets;
    const boundsMin = moment.utc(aggCheck.meta.timefilterMin);
    const boundsMax = moment.utc(aggCheck.meta.timefilterMax);
    const data = _.chain(buckets)
    .filter(filterPartialBuckets(boundsMin, boundsMax, respBucketSize))
    // if bucket has a doc count, map it to X/Y coords for charting. Otherwise null makes the line discontinuous
    .map(bucket => {
      return {
        x: bucket.key,
        y: calculation(bucket)
      };
    })
    .value();
    return {
      metric: pickMetricFields(metric),
      data: data
    };
  });
};

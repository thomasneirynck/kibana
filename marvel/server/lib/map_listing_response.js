const _ = require('lodash');
const filterPartialBuckets = require('./filter_partial_buckets');
const filterMetric = require('./filter_metric');
const root = require('requirefrom')('');
const metrics = root('public/lib/metrics');

function mapChartData(metric) {
  return (row) => {
    const data = {x: row.key};
    if (metric.derivative && row.metric_deriv) {
      data.y = row.metric_deriv.normalized_value || row.metric_deriv.value || 0;
    } else {
      data.y = row.metric.value;
    }
    return data;
  };
}

function calcSlope(data) {
  var length = data.length;
  var xSum = data.reduce(function (prev, curr) { return prev + curr.x; }, 0);
  var ySum = data.reduce(function (prev, curr) { return prev + curr.y; }, 0);
  var xySum = data.reduce(function (prev, curr) { return prev + (curr.y * curr.x); }, 0);
  var xSqSum = data.reduce(function (prev, curr) { return prev + (curr.x * curr.x); }, 0);
  var numerator = (length * xySum) - (xSum * ySum);
  var denominator = (length * xSqSum) - (xSum * ySum);
  return numerator / denominator;
}

module.exports = function mapListingResponse(options) {
  const { items, listingMetrics, min, max, bucketSize } = options;
  const data = _.map(items, function (item) {
    const row = { name: item.key, metrics: {} };
    _.each(listingMetrics, function (id) {
      const metric = metrics[id];
      const data = _.chain(item[id].buckets)
        .filter(filterPartialBuckets(min, max, bucketSize))
        .map(mapChartData(metric))
        .value();
      const minVal = _.min(_.pluck(data, 'y'));
      const maxVal = _.max(_.pluck(data, 'y'));
      const lastVal = _.last(_.pluck(data, 'y'));
      const slope = calcSlope(data);
      row.metrics[id] = {
        metric: filterMetric(metric),
        min: minVal  || 0,
        max: maxVal || 0,
        last: lastVal || 0,
        slope: slope
      };
    }); // end each
    return row;
  }); // end map
  return data;
};

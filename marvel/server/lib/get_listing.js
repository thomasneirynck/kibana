const _ = require('lodash');
const moment = require('moment');
const createQuery = require('./create_query.js');
const calcAuto = require('./calculate_auto');
const root = require('requirefrom')('');
const metrics = root('public/lib/metrics');
const mapListingResponse = require('./map_listing_response');

module.exports = (req, indices, type) => {
  const config = req.server.config();
  const callWithRequest = req.server.plugins.elasticsearch.callWithRequest;
  const listingMetrics = req.payload.listingMetrics || [];
  let start = moment.utc(req.payload.timeRange.min).valueOf();
  const orgStart = start;
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const clusterUuid = req.params.clusterUuid;
  const maxBucketSize = config.get('marvel.max_bucket_size');
  const minIntervalSeconds = config.get('marvel.min_interval_seconds');

  function createTermAgg(type) {
    if (type === 'indices') {
      return {
        field: 'index_stats.index',
        size: maxBucketSize
      };
    }
    if (type === 'nodes') {
      return {
        field: 'node_stats.node_id',
        size: maxBucketSize
      };
    }
  };

  const params = {
    index: indices,
    searchType: 'count',
    ignoreUnavailable: true,
    body: {
      query: createQuery({
        start: start,
        end: end,
        clusterUuid: clusterUuid
      }),
      aggs: {}
    }
  };

  const max = end;
  const duration = moment.duration(max - orgStart, 'ms');
  const bucketSize = Math.max(minIntervalSeconds, calcAuto.near(100, duration).asSeconds());
  if (type === 'indices') {
    // performance optimization, just a few buckets are needed for table row listing
    // start-end must be large enough to cover bucket size
    start = moment.utc(end).subtract((bucketSize * 20), 'seconds').valueOf();
  }
  const min = start;

  var aggs = {
    items: {
      terms: createTermAgg(type),
      aggs: {  }
    }
  };

  listingMetrics.forEach((id) => {
    const metric = metrics[id];
    let metricAgg = null;
    if (!metric) return;
    if (!metric.aggs) {
      metricAgg = {
        metric: {},
        metric_deriv: {
          derivative: { buckets_path: 'metric', unit: 'second' }
        }
      };
      metricAgg.metric[metric.metricAgg] = {
        field: metric.field
      };
    }

    aggs.items.aggs[id] = {
      date_histogram: {
        field: 'timestamp',
        min_doc_count: 0,
        interval: bucketSize + 's',
        extended_bounds: {
          min: min,
          max: max
        }
      },
      aggs: metric.aggs || metricAgg
    };
  });

  params.body.aggs = aggs;

  return callWithRequest(req, 'search', params)
  .then(function (resp) {
    if (!resp.hits.total) {
      return [];
    }
    // call the mapping
    return mapListingResponse({
      items: resp.aggregations.items.buckets,
      listingMetrics,
      min,
      max,
      bucketSize
    });
  });

};

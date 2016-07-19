/* Run an aggregation on index_stats to get stat data for the selected time
 * range for all the active indices. The stat data is built up with passed-in
 * options that are given by the UI client as an array
 * (req.payload.listingMetrics). Every option is a key to a configuration value
 * in server/lib/metrics. Those options are used to build up a query with a
 * bunch of date histograms.
 *
 * After the result comes back from Elasticsearch, we process the date
 * histogram data with mapListingResponse to transform it into X/Y coordinates
 * for charting. This method is shared by the get_listing_nodes lib.
 */

import moment from 'moment';
import createQuery from './create_query.js';
import calcAuto from './calculate_auto';
import metrics from './metrics';
import mapListingResponse from './map_listing_response';

export default function getListingIndices(req, indices) {
  const config = req.server.config();
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const listingMetrics = req.payload.listingMetrics || [];
  let start = moment.utc(req.payload.timeRange.min).valueOf();
  const orgStart = start;
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const uuid = req.params.clusterUuid;
  const maxBucketSize = config.get('xpack.monitoring.max_bucket_size');
  const minIntervalSeconds = config.get('xpack.monitoring.min_interval_seconds');

  const metricFields = { timestampField: 'timestamp', uuidField: 'cluster_uuid' };
  const params = {
    index: indices,
    meta: 'get_listing_indices',
    type: 'index_stats',
    size: 0,
    ignoreUnavailable: true,
    ignore: [404],
    body: {
      query: createQuery({
        start,
        end,
        uuid,
        metric: metricFields }),
      aggs: {}
    }
  };

  const max = end;
  const duration = moment.duration(max - orgStart, 'ms');
  const bucketSize = Math.max(minIntervalSeconds, calcAuto.near(100, duration).asSeconds());
  // performance optimization to avoid overwhelming amount of results
  start = moment.utc(end).subtract(2, 'minutes').valueOf();
  const min = start;

  var aggs = {
    items: {
      terms: { field: 'index_stats.index', size: maxBucketSize },
      aggs: {}
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
  .then(resp => {
    if (!resp.hits.total) {
      return [];
    }
    // call the mapping
    return mapListingResponse({
      type: 'indices',
      items: resp.aggregations.items.buckets,
      listingMetrics,
      min,
      max,
      bucketSize
    });
  });

};

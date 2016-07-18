import _ from 'lodash';
import moment from 'moment';

/*
 * Options object:
 * @param {Array} options.filters - additional filters to add to the `bool` section of the query. Default: []
 * @param {string} options.uuid - a UUID of the metric to filter for
 * @param {Metric} options.metric - an instance from server/lib/metric_classes (optional, defaults to ElasticsearchMetric)
 * @param {Date} options.start - numeric timestamp (optional)
 * @param {Date} options.end - numeric timestamp (optional)
 */
export default function createQuery(options) {
  options = _.defaults(options, { filters: [] });
  const uuidField = _.get(options, 'metric.uuidField') || 'cluster_uuid';
  let uuidFilter; // uuid could be null (getting all the clusters)
  if (uuidField && options.uuid) {
    uuidFilter = { term: { [uuidField]: options.uuid } };
  }
  const timestampField = _.get(options, 'metric.timestampField') || 'timestamp';
  const timeRangeFilter = {
    range: {
      [timestampField]: {
        format: 'epoch_millis'
      }
    }
  };
  if (options.start) {
    timeRangeFilter.range[timestampField].gte = moment.utc(options.start).valueOf();
  }
  if (options.end) {
    timeRangeFilter.range[timestampField].lte = moment.utc(options.end).valueOf();
  }
  const filters = [uuidFilter, ...options.filters];
  if (options.end || options.start) {
    filters.push(timeRangeFilter);
  }
  return {
    bool: {
      filter: {
        bool: {
          must: _.filter(filters, (val) => !_.isUndefined(val))
        }
      }
    }
  };
};

var _ = require('lodash');
const moment = require('moment');

module.exports = function createQuery(options) {
  options = _.defaults(options, { filters: [] });
  var clusterFilter;
  var kibanaFilter;
  if (options.clusterUuid) {
    clusterFilter = { term: { cluster_uuid: options.clusterUuid } };
  }
  if (options.kibanaUuid) {
    kibanaFilter = { term: { 'kibana_stats.kibana.uuid': options.kibanaUuid } };
  }
  var timeRangeFilter = {
    range: {
      timestamp: {
        format: 'epoch_millis'
      }
    }
  };
  if (options.start) {
    timeRangeFilter.range.timestamp.gte = moment.utc(options.start).valueOf();
  }
  if (options.end) {
    timeRangeFilter.range.timestamp.lte = moment.utc(options.end).valueOf();
  }
  const filters = [clusterFilter, kibanaFilter, ...options.filters];
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

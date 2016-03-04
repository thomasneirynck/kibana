var _ = require('lodash');
var moment = require('moment');
module.exports = function (req, start, end) {
  var callWithRequest = req.server.plugins.monitoring.callWithRequest;
  var config = req.server.config();
  var pattern = config.get('monitoring.index_prefix') + '*';
  var options = {
    index: pattern,
    level: 'indices',
    meta: 'calculate_indices',
    ignoreUnavailable: true,
    body: {
      fields: ['timestamp'],
      index_constraints: {
        timestamp: {
          max_value: { gte: moment.utc(start).toISOString() },
          min_value: { lte: moment.utc(end).toISOString() }
        }
      }
    }
  };
  return callWithRequest(req, 'fieldStats', options)
    .then(function (resp) {
      var indices = _.map(resp.indices, function (_info, index) {
        return index;
      });
      if (indices.length === 0) return ['.kibana-devnull'];
      return indices.filter(index => index !== config.get('monitoring.index'));
    });
};

import _ from 'lodash';
import moment from 'moment';
import checkMonitoringAuth from './check_monitoring_auth';

module.exports = function calculateIndices(req, start, end) {

  /* checkMonitoringAuth tests access to monitoring indices. If access is
   * denied, the route will catch the rejected promise
   */
  return checkMonitoringAuth(req)
  .then(() => {
    const callWithRequest = req.server.plugins.monitoring.callWithRequest;
    const config = req.server.config();
    const options = {
      index: `${config.get('xpack.monitoring.index_prefix')}*`,
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
      return indices.filter(index => index !== config.get('xpack.monitoring.index'));
    });
  });

};

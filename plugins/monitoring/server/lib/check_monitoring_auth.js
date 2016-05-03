import Promise from 'bluebird';

// Check "read" privileges on monitoring-*. If authentication doesn't have privilege to view
// monitoring data, then this causes the permissions error, instead of
// leaving fieldStats to cause a 404 error.
export default function checkMonitoringAuth(req) {
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();

  function checkDataIndex() {
    return callWithRequest(req, 'count', {
      index: config.get('xpack.monitoring.index')
    });
  }
  function checkStatsIndices() {
    return callWithRequest(req, 'count', {
      index: `${config.get('xpack.monitoring.index_prefix')}*`
    });
  }

  // run through checks in a series, so the first failure can reject the promise
  return Promise.mapSeries([checkDataIndex(), checkStatsIndices()], () => true);
};

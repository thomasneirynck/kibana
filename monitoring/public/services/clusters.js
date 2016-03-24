const module = require('ui/modules').get('monitoring/clusters');

module.service('monitoringClusters', (timefilter, $http, Private) => {
  const url = '../api/monitoring/v1/clusters';
  return () => {
    const { min, max } = timefilter.getBounds();
    return $http.post(url, {
      timeRange: {
        min: min.toISOString(),
        max: max.toISOString()
      }
    })
    .then(response => response.data)
    .catch(err => {
      const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
      return ajaxErrorHandlers.fatalError(err);
    });
  };
});

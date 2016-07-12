import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handlers';

const mod = uiModules.get('monitoring/clusters');
mod.service('monitoringClusters', (timefilter, $http, Private) => {
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
      const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
      return ajaxErrorHandlers.fatalError(err);
    });
  };
});

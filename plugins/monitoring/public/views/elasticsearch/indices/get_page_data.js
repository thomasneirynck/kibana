import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';

export function getPageData($injector) {
  const globalState = $injector.get('globalState');
  const timefilter = $injector.get('timefilter');
  const $http = $injector.get('$http');
  const features = $injector.get('features');

  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/indices`;
  const showSystemIndices = features.isEnabled('showSystemIndices', false);
  const timeBounds = timefilter.getBounds();

  /* TODO: get `pageIndex`, `filterText`, `sortKey`, `sortOrder` through `getLocalStorageData`
   * and send params through API */

  return $http.post(url, {
    showSystemIndices,
    ccs: globalState.ccs,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    }
  })
  .then(response => response.data)
  .catch((err) => {
    const Private = $injector.get('Private');
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

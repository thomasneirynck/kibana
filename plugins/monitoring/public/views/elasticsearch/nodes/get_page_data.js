import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';

export function getPageData($injector) {
  const $http = $injector.get('$http');
  const globalState = $injector.get('globalState');
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes`;
  const timefilter = $injector.get('timefilter');
  const timeBounds = timefilter.getBounds();

  const createRow = rowData => {
    if (!rowData) {
      return null;
    }
    return {
      status: rowData.isOnline ? 'Online' : 'Offline',
      ...rowData
    };
  };

  return $http.post(url, {
    ccs: globalState.ccs,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    }
  })
    .then(response => {
      return {
        clusterStatus: response.data.clusterStatus,
        nodes: response.data.nodes.map(createRow)
      };
    })
    .catch((err) => {
      const Private = $injector.get('Private');
      const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
      return ajaxErrorHandlers(err);
    });
}

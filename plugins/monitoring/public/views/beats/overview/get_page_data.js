import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';

export function getPageData($injector) {
  const $http = $injector.get('$http');
  const globalState = $injector.get('globalState');
  const timefilter = $injector.get('timefilter');
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/beats`;

  return $http.post(url, {
    ccs: globalState.ccs,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      {
        name: 'beat_failed_and_queued',
        keys: [
          'beat_cluster_events_failed_rate',
          'beat_cluster_events_queued_rate',
        ]
      },
      {
        name: 'beat_published_and_acknowledged',
        keys: [
          'beat_cluster_events_published_rate',
          'beat_cluster_events_acknowledged_rate',
        ]
      },
      'beat_cluster_throughput_bytes_rate',
    ]
  })
    .then(response => response.data)
    .catch((err) => {
      const Private = $injector.get('Private');
      const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
      return ajaxErrorHandlers(err);
    });
}

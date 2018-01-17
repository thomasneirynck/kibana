import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';

export function getPageData($injector) {
  const $http = $injector.get('$http');
  const $route = $injector.get('$route');
  const globalState = $injector.get('globalState');
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/beats/beat/${$route.current.params.beatUuid}`;
  const timefilter = $injector.get('timefilter');
  const timeBounds = timefilter.getBounds();

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
          'beat_events_failed_rate',
          'beat_events_queued_rate',
        ]
      },
      'beat_bytes_written',
      {
        name: 'beat_published_and_acknowledged',
        keys: [
          'beat_events_published_rate',
          'beat_events_acknowledged_rate',
        ]
      },
      'beat_cpu_utilization',
      {
        name: 'beat_dropped_retry_filtered',
        keys: [
          'beat_events_dropped_rate',
          'beat_events_retry_rate',
          'beat_events_filtered_rate',
        ]
      },
      'beat_bytes_mem_alloc', // TODO: Beats team to provide total process memory consumption.
    ]
  })
    .then(response => response.data)
    .catch((err) => {
      const Private = $injector.get('Private');
      const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
      return ajaxErrorHandlers(err);
    });
}

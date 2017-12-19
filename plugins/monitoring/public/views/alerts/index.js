import { find, get } from 'lodash';
import uiRoutes from 'ui/routes';
import template from './index.html';
import { MonitoringViewBaseController } from 'plugins/monitoring/views';
import { routeInitProvider } from 'plugins/monitoring/lib/route_init';
import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';
import { formatTimestampToDuration } from 'monitoring-common';
import { CALCULATE_DURATION_SINCE } from 'monitoring-constants';
import { mapSeverity } from 'plugins/monitoring/components/alerts/map_severity';

function getPageData($injector) {
  const globalState = $injector.get('globalState');
  const $http = $injector.get('$http');
  const Private = $injector.get('Private');
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/alerts`;

  return $http.post(url, { ccs: globalState.ccs })
  .then(response => {
    const alerts = get(response, 'data', []);
    return alerts.map(alert => {
      return {
        ...alert,
        since: formatTimestampToDuration(alert.timestamp, CALCULATE_DURATION_SINCE),
        severity_group: mapSeverity(alert.metadata.severity).value
      };
    });
  })
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/alerts', {
  template,
  resolve: {
    clusters(Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    alerts: getPageData
  },
  controllerAs: 'alerts',
  controller: class AlertsView extends MonitoringViewBaseController {
    constructor($injector, $scope) {
      const $route = $injector.get('$route');
      const globalState = $injector.get('globalState');

      // breadcrumbs + page title
      $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });

      super({
        title: 'Cluster Alerts',
        getPageData,
        $scope,
        $injector,
        options: { enableTimeFilter: false }
      });

      this.data = $route.current.locals.alerts;
    }
  }
});

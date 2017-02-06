/*
 * Logstash Node Advanced View
 */
import _ from 'lodash';
import uiRoutes from'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

function getPageData(timefilter, globalState, $http, $route, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/logstash/node/${$route.current.params.uuid}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      {
        name: 'logstash_node_cpu_utilization',
        keys: [
          'logstash_node_cpu_utilization',
          'logstash_node_cgroup_quota'
        ]
      },
      {
        name: 'logstash_node_cgroup_cpu',
        keys: [
          'logstash_node_cgroup_usage',
          'logstash_node_cgroup_throttled'
        ]
      },
      {
        name: 'logstash_node_cgroup_stats',
        keys: [
          'logstash_node_cgroup_periods',
          'logstash_node_cgroup_throttled_count'
        ]
      },
      'logstash_queue_events_count'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/logstash/node/:uuid/advanced', {
  template,
  resolve: {
    clusters(Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('logstashNodeAdvanced', ($route, globalState, title, Private, $executor, $http, timefilter, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, `Logstash - ${$scope.pageData.nodeSummary.name} - Advanced`);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, $route, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});

/**
 * Controller for Node Listing
 */
import { find } from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

function getPageData(timefilter, globalState, $http, Private, showCgroupMetricsElasticsearch) {

  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes`;

  const cpuListingMetrics = (() => {
    if (showCgroupMetricsElasticsearch) {
      return [
        'node_cgroup_quota',
        'node_cgroup_throttled'
      ];
    }
    return [
      'node_cpu_utilization',
      'node_load_average'
    ];
  })();

  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    listingMetrics: [
      ...cpuListingMetrics,
      'node_jvm_mem_percent',
      'node_free_space'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });

}

uiRoutes.when('/elasticsearch/nodes', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'plugins/monitoring/directives' ]);
uiModule.controller('nodes', (
  $route, timefilter, globalState, title, Private, $executor, $http, $scope, showCgroupMetricsElasticsearch
) => {
  timefilter.enabled = true;

  $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });
  $scope.pageData = $route.current.locals.pageData;

  title($scope.cluster, 'Elasticsearch - Nodes');

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, Private, showCgroupMetricsElasticsearch),
    handleResponse: (response) => $scope.pageData = response
  });

  $executor.start();

  $scope.$on('$destroy', $executor.destroy);
});

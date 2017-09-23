/**
 * Controller for Node Listing
 */
import { find, get } from 'lodash';
import uiRoutes from 'ui/routes';
import { uiModules } from 'ui/modules';
import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';
import { routeInitProvider } from 'plugins/monitoring/lib/route_init';
import template from './index.html';

function getPageData($injector) {
  const $http = $injector.get('$http');
  const globalState = $injector.get('globalState');
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes`;
  const showCgroupMetricsElasticsearch = $injector.get('showCgroupMetricsElasticsearch');
  const timefilter = $injector.get('timefilter');
  const timeBounds = timefilter.getBounds();

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
  // TODO move to back-end
  const createRow = rowData => {
    if (!rowData) {
      return null;
    }
    return {
      nodeName: get(rowData, 'node.name'),
      status: rowData.online ? 'Online' : 'Offline',
      ...rowData
    };
  };

  return $http.post(url, {
    ccs: globalState.ccs,
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
  .then(response => {
    return {
      ...response.data,
      rows: response.data.rows.map(createRow)
    };
  })
  .catch((err) => {
    const Private = $injector.get('Private');
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
uiModule.controller('nodes', ($injector, $scope) => {
  const timefilter = $injector.get('timefilter');
  timefilter.enabled = true;

  const $route = $injector.get('$route');
  const globalState = $injector.get('globalState');
  $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });
  $scope.pageData = $route.current.locals.pageData;

  const title = $injector.get('title');
  title($scope.cluster, 'Elasticsearch - Nodes');

  const $executor = $injector.get('$executor');
  $executor.register({
    execute: () => getPageData($injector),
    handleResponse: (response) => $scope.pageData = response
  });

  $executor.start();

  $scope.$on('$destroy', $executor.destroy);
});

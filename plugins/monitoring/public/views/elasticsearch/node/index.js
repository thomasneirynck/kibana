/**
 * Controller for Node Detail
 */
import { find, partial } from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

function getPageData(timefilter, globalState, $route, $http, Private, features, showCgroupMetricsElasticsearch) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes/${$route.current.params.node}`;
  const showSystemIndices = features.isEnabled('showSystemIndices', false);

  return $http.post(url, {
    showSystemIndices,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      {
        name: 'node_latency',
        keys: [
          'node_query_latency',
          'node_index_latency'
        ]
      },
      {
        name: 'node_jvm_mem',
        keys: [ 'node_jvm_mem_max_in_bytes', 'node_jvm_mem_used_in_bytes' ]
      },
      {
        name: 'node_mem',
        keys: [ 'node_index_mem_overall' ],
        config: 'xpack.monitoring.chart.elasticsearch.node.index_memory'
      },
      {
        name: 'node_cpu_metric',
        keys: showCgroupMetricsElasticsearch ?
          [ 'node_cgroup_quota_as_cpu_utilization' ] :
          [ 'node_cpu_utilization' ]
      },
      'node_load_average',
      'node_segment_count'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/elasticsearch/nodes/:node', {
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
uiModule.controller('esNode', (
  timefilter, $route, globalState, title, Private, $executor, $http, $scope, features, showCgroupMetricsElasticsearch
) => {
  timefilter.enabled = true;

  $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });
  $scope.pageData = $route.current.locals.pageData;

  title($scope.cluster, `Elasticsearch - Nodes - ${$scope.pageData.nodeSummary.name} - Overview`);

  function setPageIconLabel(pageData) {
    $scope.iconClass = pageData.nodeSummary.nodeTypeClass;
    $scope.iconLabel = pageData.nodeSummary.nodeTypeLabel;
  }
  setPageIconLabel($scope.pageData);

  const callPageData = partial(
    getPageData, timefilter, globalState, $route, $http, Private, features, showCgroupMetricsElasticsearch
  );
  // show/hide system indices in shard allocation view
  $scope.showSystemIndices = features.isEnabled('showSystemIndices', false);
  $scope.toggleShowSystemIndices = (isChecked) => {
    $scope.showSystemIndices = isChecked;
    // preserve setting in localStorage
    features.update('showSystemIndices', isChecked);
    // update the page
    callPageData().then((pageData) => $scope.pageData = pageData);
  };

  $executor.register({
    execute: () => callPageData(),
    handleResponse: (response) => {
      $scope.pageData = response;
      setPageIconLabel(response);
    }
  });

  $executor.start();

  $scope.$on('$destroy', $executor.destroy);
});

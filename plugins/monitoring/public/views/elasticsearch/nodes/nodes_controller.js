/**
 * Controller for Node Listing
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handlers';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/elasticsearch/nodes/nodes_template.html';

function getPageData(timefilter, globalState, $http, Private, features) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes`;
  const showMasterNodes = features.isEnabled('showMasterNodes', true);
  const showDataNodes = features.isEnabled('showDataNodes', true);
  const showClientNodes = features.isEnabled('showClientNodes', true);

  return $http.post(url, {
    showMasterNodes,
    showDataNodes,
    showClientNodes,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    listingMetrics: [
      'node_cpu_utilization',
      'node_jvm_mem_percent',
      'node_load_average',
      'node_free_space'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers.fatalError(err);
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
uiModule.controller('nodes',
($route, timefilter, globalState, title, features, Private, $executor, $http, monitoringClusters, $scope) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, 'Elasticsearch - Nodes');

  const callPageData = _.partial(getPageData, timefilter, globalState, $http, Private, features);

  // show/hides
  $scope.showMasterNodes = features.isEnabled('showMasterNodes', true);
  $scope.showDataNodes = features.isEnabled('showDataNodes', true);
  $scope.showClientNodes = features.isEnabled('showClientNodes', true);
  $scope.toggleShowNodes = (type) => {
    const typeFeatureNameMap = {
      master: 'showMasterNodes',
      data: 'showDataNodes',
      client: 'showClientNodes'
    };
    // flip the bool
    const featureName = typeFeatureNameMap[type];
    $scope[featureName] = !$scope[featureName];
    // preserve in localStorage
    features.update(featureName, $scope[featureName]);
    // update the page
    callPageData().then((pageData) => $scope.pageData = pageData);
  };

  $executor.register({
    execute: () => callPageData(),
    handleResponse: (response) => $scope.pageData = response
  });

  $executor.register({
    execute: () => monitoringClusters(),
    handleResponse: setClusters
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);

});

import _ from 'lodash';
const module = require('ui/modules').get('monitoring', ['monitoring/directives']);

require('ui/routes')
.when('/overview', {
  template: require('plugins/monitoring/views/clusters/overview_template.html'),
  resolve: {
    // Data for overview for single cluster simply uses the set of clusters
    // returned from routeInit, and finds the cluster with the current UUID in
    // globalState.
    clusters: function (Private) {
      const routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    }
  }
});

module.controller('overview', ($scope, $route, monitoringClusters, timefilter, title, globalState, $executor) => {
  // This will show the timefilter
  timefilter.enabled = true;

  $scope.clusters = $route.current.locals.clusters;
  $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  title($scope.cluster, 'Overview');

  $executor.register({
    execute: () => monitoringClusters(),
    handleResponse(clusters) {
      $scope.cluster = _.find(clusters, { cluster_uuid: globalState.cluster_uuid });
    }
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);
});

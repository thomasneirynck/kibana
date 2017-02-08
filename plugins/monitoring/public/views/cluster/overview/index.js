import { find } from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

uiRoutes.when('/overview', {
  template,
  resolve: {
    clusters: function (Private) {
      // checks license info of all monitored clusters for multi-cluster monitoring usage and capability
      const routeInit = Private(routeInitProvider);
      return routeInit();
    }
  }
});

const uiModule = uiModules.get('monitoring', ['monitoring/directives']);
uiModule.controller('overview', ($scope, $route, monitoringClusters, timefilter, title, globalState, $executor) => {
  // This will show the timefilter
  timefilter.enabled = true;

  $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });
  title($scope.cluster, 'Overview');

  $executor.register({
    execute: () => monitoringClusters(globalState.cluster_uuid),
    handleResponse(cluster) {
      $scope.cluster = cluster;
    }
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);
});

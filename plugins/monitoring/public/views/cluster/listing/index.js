import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

uiRoutes.when('/home', {
  template,
  resolve: {
    clusters: (Private, kbnUrl) => {
      const routeInit = Private(routeInitProvider);
      return routeInit()
      .then(clusters => {
        if (!clusters || !clusters.length) {
          kbnUrl.changePath('/no-data');
          return Promise.reject();
        }
        if (clusters.length === 1) {
          // Bypass the cluster listing if there is just 1 cluster
          kbnUrl.changePath('/overview');
          return Promise.reject();
        }
        return clusters;
      });
    }
  }
})
.otherwise({ redirectTo: '/no-data' });

const uiModule = uiModules.get('monitoring', ['monitoring/directives']);
uiModule.controller('home', ($route, $scope, globalState, monitoringClusters, timefilter, title, $executor) => {
  timefilter.enabled = true;

  // Set the key for the cluster_uuid. This is mainly for
  // react.js so we can use the key easily.
  function setKeyForClusters(cluster) {
    cluster.key = cluster.cluster_uuid;
    return cluster;
  }

  $scope.clusters = $route.current.locals.clusters.map(setKeyForClusters);
  $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });

  title();

  $executor.register({
    execute: () => monitoringClusters(),
    handleResponse(clusters) {
      $scope.clusters = clusters.map(setKeyForClusters);
    }
  });

  $executor.start();

  $scope.$on('$destroy', $executor.destroy);
});

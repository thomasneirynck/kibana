const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [
  'monitoring/directives'
]);

require('ui/routes')
.when('/license', {
  template: require('plugins/monitoring/views/license/index.html'),
  resolve: {
    clusters(Private) {
      var routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    }
  }
});

mod.controller('licenseView', ($route, globalState, title, timefilter, $scope, $window) => {
  timefilter.enabled = false;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  title($scope.cluster, 'License');

  $scope.isExpired = (new Date()).getTime() > _.get($scope, 'cluster.license.expiry_date_in_millis');

  $scope.goBack = function () {
    $window.history.back();
  };
});

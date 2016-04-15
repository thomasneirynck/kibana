const _ = require('lodash');
const mod = require('ui/modules').get('monitoring', [
  'monitoring/directives'
]);

require('ui/routes')
.when('/license', {
  template: require('plugins/monitoring/views/license/index.html'),
  resolve: {
    monitoring(Private) {
      var routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    }
  }
});

mod.controller('licenseView', ($route, globalState, Private, timefilter, $scope, $window) => {

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster });
  }
  setClusters($route.current.locals.monitoring.clusters);

  const docTitle = Private(require('ui/doc_title'));
  docTitle.change('Monitoring - License', true);

  $scope.isExpired = (new Date()).getTime() > _.get($scope, 'cluster.license.expiry_date_in_millis');

  $scope.goBack = function () {
    $window.history.back();
  };

  timefilter.enabled = false;

});

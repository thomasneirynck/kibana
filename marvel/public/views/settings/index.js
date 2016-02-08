define(function (require) {
  var _ = require('lodash');
  var angular = require('angular');
  var metrics = require('plugins/monitoring/lib/metrics');

  require('plugins/monitoring/services/settings');
  require('ui/notify/notify');

  var module = require('ui/modules').get('monitoring', [
    'kibana/notify',
    'monitoring/directives',
    'monitoring/settings'
  ]);

  // require('ui/routes')
  // .when('/settings', {
  //   template: require('plugins/monitoring/views/settings/index.html'),
  //   resolve: {
  //     monitoring: function (Private) {
  //       var routeInit = Private(require('plugins/monitoring/lib/route_init'));
  //       return routeInit({ force: { settings: true } });
  //     }
  //   }
  // });

  module.controller('settings', function (timefilter, courier, $scope, $route, Notifier, Private, globalState) {
    // var ClusterStatusDataSource = Private(require('plugins/monitoring/directives/cluster_status/data_source'));

    var notify = new Notifier({ location: 'Monitoring Settings' });
    var settings = $route.current.locals.monitoring.settings[globalState.cluster + ':metric-thresholds'];
    var indexPattern = $route.current.locals.monitoring.indexPattern;
    var clusters = $route.current.locals.monitoring.clusters;

    $scope.metrics = metrics;
    $scope.dataSources = {};

    // var dataSource = new ClusterStatusDataSource(indexPattern, globalState.cluster, clusters);
    // $scope.dataSources.cluster_status = dataSource;
    // dataSource.register(courier);
    // courier.fetch();

    // $scope.$on('$destroy', function () {
    //   _.each($scope.dataSources, function (dataSource) {
    //     dataSource.destroy();
    //   });
    // });

    // Create a model for the view to easily work with
    $scope.model = {};
    _.each(metrics, function (val, key) {
      $scope.model[key] = settings.get(key);
    });

    // Set the settings from the model and save.
    $scope.save = function () {
      $scope.saving = true;
      settings.set($scope.model);
      settings.save().then(function () {
        notify.info('Settings saved successfully.');
        $scope.saving = false;
      });
    };
  });

});

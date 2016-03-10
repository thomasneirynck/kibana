define(function (require) {
  var module = require('ui/modules').get('monitoring', [
    'monitoring/directives'
  ]);

  require('ui/routes')
  .when('/home', {
    template: require('plugins/monitoring/views/home/home_template.html'),
    resolve: {
      clusters: function (Private, monitoringClusters, kbnUrl, globalState) {
        var phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
        return monitoringClusters.fetch().then(function (clusters) {
          var cluster;
          if (!clusters.length) {
            kbnUrl.changePath('/no-data');
            return Promise.reject();
          }
          if (clusters.length === 1) {
            cluster = clusters[0];
            globalState.cluster = cluster.cluster_uuid;
            if (cluster.license.type === 'basic') {
              globalState.save();
              kbnUrl.changePath('/overview');
              return Promise.reject();
            }
          }
          return clusters;
        }).then(function (clusters) {
          return phoneHome.sendIfDue(clusters).then(function () {
            return clusters;
          });
        });
      }
    }
  })
  .otherwise({ redirectTo: '/no-data' });

  module.controller('home', function ($route, $scope, monitoringClusters, timefilter, Private, $executor) {

    // Set the key for as the cluster_uuid. This is mainly for
    // react.js so we can use the key easily.
    function setKeyForClusters(cluster) {
      cluster.key = cluster.cluster_uuid;
      return cluster;
    }

    timefilter.enabled = false;

    $scope.clusters = $route.current.locals.clusters
      .map(setKeyForClusters);

    // This will display the timefilter
    // timefilter.enabled = true;

    var docTitle = Private(require('ui/doc_title'));
    docTitle.change('Monitoring', true);

    // Register the monitoringClusters service.
    $executor.register({
      execute: function () {
        return monitoringClusters.fetch();
      },
      handleResponse: function (clusters) {
        $scope.clusters = clusters.map(setKeyForClusters);
      }
    });

    // Start the executor
    $executor.start({ ignorePaused: true });

    // Destory the executor
    $scope.$on('$destroy', $executor.destroy);

  });

});


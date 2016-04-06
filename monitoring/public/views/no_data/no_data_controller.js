const mod = require('ui/modules').get('monitoring', [
  'monitoring/directives'
]);
require('ui/routes')
.when('/no-data', {
  template: require('plugins/monitoring/views/no_data/no_data_template.html'),
  resolve: {
    clusters: (monitoringClusters, kbnUrl, Promise) => {
      return monitoringClusters()
      .then(clusters => {
        if (clusters.length) {
          kbnUrl.changePath('/home');
          return Promise.reject();
        }
        return Promise.resolve();
      });
    }
  }
})
.otherwise({ redirectTo: '/home' });

mod.controller('noData', (kbnUrl, $executor, monitoringClusters, timefilter) => {
  timefilter.enabled = true;

  timefilter.on('update', () => {
    // re-fetch if they change the time filter
    $executor.run();
  });

  // Register the monitoringClusters service.
  $executor.register({
    execute: function () {
      return monitoringClusters();
    },
    handleResponse: function (clusters) {
      if (clusters.length) {
        kbnUrl.changePath('/home');
      }
    }
  });
});


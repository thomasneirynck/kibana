define(function (require) {
  var _ = require('lodash');
  return function routeInitProvider(Notifier, Private, monitoringClusters, globalState, kbnUrl) {

    var phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
    var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return function () {
      var monitoring = {};
      var notify = new Notifier({ location: 'Monitoring' });
      return monitoringClusters(true)
        .then(function (clusters) {
          return phoneHome.sendIfDue(clusters).then(() => {
            return clusters;
          });
        })
        // Get the clusters
        .then(function (clusters) {
          var cluster;
          monitoring.clusters = clusters;
          // Check to see if the current cluster is available
          if (globalState.cluster && !_.find(clusters, { cluster_uuid: globalState.cluster })) {
            globalState.cluster = null;
          }
          // if there are no clusters chosen then set the first one
          if (!globalState.cluster) {
            cluster = _.first(clusters);
            if (cluster && cluster.cluster_uuid) {
              globalState.cluster = cluster.cluster_uuid;
              globalState.save();
            }
          }
          // if we don't have any clusters then redirect to home
          if (!globalState.cluster) {
            notify.error('We can\'t seem to find any clusters in your Monitoring data. Please check your Monitoring agents');
            return kbnUrl.redirect('/home');
          }
          return globalState.cluster;
        })
        // Finally filter the cluster from the nav if it's light then return the Monitoring object.
        .then(function () {
          var cluster = _.find(monitoring.clusters, { cluster_uuid: globalState.cluster });
          var license = cluster.license;
          var isExpired = (new Date()).getTime() > license.expiry_date_in_millis;

          if (isExpired && !_.contains(window.location.hash, 'license')) {
            // redirect to license, but avoid infinite loop
            kbnUrl.redirect('license');
          }
          globalState.license = license;
          return monitoring;
        })
        .catch(ajaxErrorHandlers.fatalError);
    };
  };
});

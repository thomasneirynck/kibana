var _ = require('lodash');
module.exports = function routeInitProvider(Notifier, Private, monitoringClusters, globalState, license, kbnUrl) {
  var phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
  var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
  return function () {
    var notify = new Notifier({ location: 'Monitoring' });
    return monitoringClusters()
    .then(function (clusters) {
      return phoneHome.sendIfDue(clusters).then(() => {
        return clusters;
      });
    })
    // Set the clusters collection and currentn cluster in globalState
    .then(function (clusters) {
      const cluster = (() => {
        const existingCurrent = _.find(clusters, { cluster_uuid: globalState.cluster_uuid });
        if (existingCurrent) return existingCurrent;

        const firstCluster = _.first(clusters);
        if (firstCluster && firstCluster.cluster_uuid) return firstCluster;

        return null;
      }());

      if (cluster) {
        globalState.cluster_uuid = cluster.cluster_uuid;
        globalState.save();
      } else {
        notify.error('We can\'t seem to find any clusters in your Monitoring data. Please check your Monitoring agents');
        return kbnUrl.redirect('/no-data');
      }

      const clusterLicense = cluster.license;
      const isExpired = (new Date()).getTime() > clusterLicense.expiry_date_in_millis;

      if (isExpired && !_.contains(window.location.hash, 'license')) {
        // redirect to license, but avoid infinite loop
        // eventually this should be a redirect to Kibana Management page
        kbnUrl.redirect('/license');
      }
      license.setLicenseType(clusterLicense.type);
      return clusters;
    })
    .catch(ajaxErrorHandlers.fatalError);
  };
};

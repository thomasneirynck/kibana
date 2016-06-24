var _ = require('lodash');
module.exports = function routeInitProvider(Notifier, Private, monitoringClusters, globalState, license, kbnUrl) {
  var phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
  var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));

  function isOnPage(hash) {
    return _.contains(window.location.hash, hash);
  }

  // check if the license expiration is in the future
  function isLicenseFresh(expiryDateInMillis) {
    return (new Date()).getTime() < expiryDateInMillis;
  }

  // returns true if license is not basic or if the data just has a single cluster
  function isClusterSupported(isBasic, clusters) {
    return (!isBasic || clusters.length === 1);
  }

  return function () {
    var notify = new Notifier({ location: 'Monitoring' });
    return monitoringClusters()
    .then(function (clusters) {
      return phoneHome.sendIfDue(clusters).then(() => {
        return clusters;
      });
    })
    // Set the clusters collection and current cluster in globalState
    .then(function (clusters) {
      const cluster = (() => {
        const existingCurrent = _.find(clusters, { cluster_uuid: globalState.cluster_uuid });
        if (existingCurrent) return existingCurrent;

        const firstCluster = _.first(clusters);
        if (firstCluster && firstCluster.cluster_uuid) return firstCluster;

        return null;
      }());

      if (cluster && cluster.license) {
        globalState.cluster_uuid = cluster.cluster_uuid;
        globalState.save();
      } else {
        notify.error('We can\'t seem to find any valid clusters in your Monitoring data. Please check your Monitoring agents');
        return kbnUrl.redirect('/no-data');
      }

      const clusterLicense = cluster.license;
      license.setLicenseType(clusterLicense.type);

      // check if we need to redirect because of license expiration
      if (!isOnPage('license') && !isLicenseFresh(clusterLicense.expiry_date_in_millis)) {
        return kbnUrl.redirect('/license');
      }

      // check if we need to redirect because of check if multi-cluster monitoring, and if its allowed
      if (!isOnPage('home') && !isClusterSupported(license.isBasic(), clusters)) {
        return kbnUrl.redirect('/home');
      }

      return clusters;
    })
    .catch(ajaxErrorHandlers.fatalError);
  };
};

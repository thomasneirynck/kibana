var _ = require('lodash');
module.exports = function routeInitProvider(Notifier, Private, monitoringClusters, globalState, license, kbnUrl) {
  var phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
  var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));

  // check if the license is expired and if anything needs to be done about it
  function isLicenseFresh(expiryDateInMillis) {
    const isExpired = (new Date()).getTime() > expiryDateInMillis;
    const alreadyOnLicensePage = _.contains(window.location.hash, 'license');
    return !isExpired || alreadyOnLicensePage;
  }

  // check if the setup is multi-cluster mode, and that mode is supported
  function isMultiClusterSupported(isBasic, clusters) {
    const onClusterListing = _.contains(window.location.hash, 'home');
    if (clusters.length > 1 && isBasic && !onClusterListing) {
      return false;
    }
    return true;
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

      // check license expiration
      if (!isLicenseFresh(clusterLicense.expiry_date_in_millis)) {
        return kbnUrl.redirect('/license');
      }

      // check if multi-cluster monitoring, and if its allowed
      if (!isMultiClusterSupported(license.isBasic(), clusters)) {
        return kbnUrl.redirect('/home');
      }

      return clusters;
    })
    .catch(ajaxErrorHandlers.fatalError);
  };
};

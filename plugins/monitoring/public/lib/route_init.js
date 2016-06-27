import _ from 'lodash';

export default function routeInitProvider(Private, monitoringClusters, globalState, license, kbnUrl) {
  const phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
  const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));

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

  return function routeInit() {
    return monitoringClusters()
    .then((clusters) => {
      phoneHome.sendIfDue(clusters); // run in background, ignore return value
      return clusters;
    })
    // Set the clusters collection and current cluster in globalState
    .then((clusters) => {
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

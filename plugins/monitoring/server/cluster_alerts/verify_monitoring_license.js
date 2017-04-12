/**
 * Determine if an API for Cluster Alerts should respond based on the license and configuration of the monitoring cluster.
 *
 * Note: This does not guarantee that any production cluster has a valid license; only that Cluster Alerts in general can be used!
 *
 * @param  {Object} server Serevr object containing config and plugins
 * @return {Boolean} {@code true} to indicate that cluster alerts can be used.
 */
export function verifyMonitoringLicense(server) {
  const config = server.config();

  // if cluster alerts are enabled, then ensure that we can use it according to the license
  if (config.get('xpack.monitoring.cluster_alerts.enabled')) {
    const monitoringCluster = server.plugins.monitoring.info.feature('monitoring').getLicenseCheckResults();

    return {
      enabled: monitoringCluster.clusterAlerts.enabled,
      message: monitoringCluster.message
    };
  }

  return { enabled: false, message: 'Cluster Alerts is disabled.' };
}

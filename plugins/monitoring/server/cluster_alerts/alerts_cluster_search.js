import { get } from 'lodash';
import { verifyMonitoringLicense } from './verify_monitoring_license';

/**
 * Retrieve any statically defined cluster alerts (not indexed) for the {@code cluster}.
 *
 * In the future, if we add other static cluster alerts, then we should probably just return an array.
 * It may also make sense to put this into its own file in the future.
 *
 * @param {Object} cluster The cluster object containing the cluster's license.
 * @return {Object} The alert to use for the cluster. {@code null} if none.
 */
export function staticAlertForCluster(cluster) {
  const clusterNeedsTLSEnabled = get(cluster, 'license.cluster_needs_tls', false);

  if (clusterNeedsTLSEnabled) {
    const versionParts = get(cluster, 'version', '').split('.');
    const version = versionParts.length > 1 ? `${versionParts[0]}.${versionParts[1]}` : 'current';

    return {
      metadata: {
        severity: 0,
        cluster_uuid: cluster.cluster_uuid,
        link: `https://www.elastic.co/guide/en/x-pack/${version}/ssl-tls.html`
      },
      update_timestamp: cluster.timestamp,
      timestamp: get(cluster, 'license.issue_date', cluster.timestamp),
      prefix: 'Configuring TLS will be required to apply a Gold or Platinum license when security is enabled.',
      message: 'See documentation for details.'
    };
  }

  return null;
}

/**
 * @param {Object} req Request object from the API route
 * @param {String} cluster The cluster being checked
 */
export function alertsClusterSearch(req, alertsIndex, cluster, checkLicense, options = {}) {
  const verification = verifyMonitoringLicense(req.server);

  if (!verification.enabled) {
    return Promise.resolve({ message: verification.message });
  }

  const license = get(cluster, 'license', {});
  const prodLicenseInfo = checkLicense(license.type, license.status === 'active', 'production');

  if (prodLicenseInfo.clusterAlerts.enabled) {
    const config = req.server.config();
    const size = options.size || config.get('xpack.monitoring.max_bucket_size');

    const params = {
      index: alertsIndex,
      ignoreUnavailable: true,
      filterPath: 'hits.hits._source',
      body: {
        size,
        query: {
          bool: {
            must_not: [
              {
                exists: { field: 'resolved_timestamp' }
              }
            ],
            filter: [
              {
                term: { 'metadata.cluster_uuid': cluster.cluster_uuid }
              }
            ]
          }
        },
        sort: [
          { 'metadata.severity': { order: 'desc' } },
          { 'timestamp': { order: 'asc' } }
        ]
      }
    };

    const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
    return callWithRequest(req, 'search', params)
    .then(result => {
      const hits = get(result, 'hits.hits', []);
      const alerts = hits.map(alert => alert._source);

      const staticAlert = staticAlertForCluster(cluster);

      if (staticAlert) {
        alerts.push(staticAlert);
      }

      return alerts;
    });
  }

  return Promise.resolve({ message: prodLicenseInfo.message });
}

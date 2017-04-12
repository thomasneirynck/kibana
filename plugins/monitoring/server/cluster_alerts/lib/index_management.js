import { get } from 'lodash';
import { checkLicense } from '../check_license';

/**
 * Find cluster UUIDs that should have cluster alerts enabled.
 *
 * @param res The response from Elasticsearch.
 * @param supportsAlerts {@code true} to find clusters that support cluster alerts. {@code false} for all other clusters.
 * @return {Array} Cluster UUIDs that should have cluster alerts enabled.
 */
export function handleFindClustersForClusterAlertsResponse(res, { supportsAlerts }) {
  // if the index doesn't exist, then we won't have any hits
  const hits = res.hits && res.hits.total ? res.hits.hits : [];

  return hits.reduce((ids, hit) => {
    const license = get(hit, '_source.license');
    const active = get(license, 'status') === 'active';
    const type = get(license, 'type', 'basic');

    const supported = checkLicense(type, active, 'production');

    if (hit._id && supported.clusterAlerts.enabled === supportsAlerts) {
      ids.push(hit._id);
    }

    return ids;
  }, []);
}

/**
 * Find clusters that should that match {@code supportsAlerts} ({@code true} for clusters that support cluster alerts; {@code false} for
 * others).
 *
 * @param server Used for logging to the server.
 * @param client Client connection configured to talk to the Monitoring cluster.
 * @param supportsAlerts {@code true} to find clusters that support cluster alerts. {@code false} for all other clusters.
 * @return {Promise} Array of cluster UUIDs that need to be processed.
 */
export function findClustersForClusterAlerts(server, client, { supportsAlerts = true }) {
  const config = server.config();

  // TODO: If we ever remove the xpack.monitoring.index, then the
  //       supportAlerts flag can become a query rather than a hardcoded check
  return client.search({
    index: config.get('xpack.monitoring.index'),
    type: 'cluster_info',
    _source: [ 'license.status', 'license.type' ],
    size: config.get('xpack.monitoring.max_bucket_size'),
    filterPath: [ 'hits.total', 'hits.hits._id', 'hits.hits._source.license.status', 'hits.hits._source.license.type' ],
    ignoreUnavailable: true
  })
  .then(res => handleFindClustersForClusterAlertsResponse(res, { supportsAlerts }))
  .catch(err => {
    const monitoringTag = config.get('xpack.monitoring.loggingTag');
    server.log(['error', monitoringTag], `Failed to lookup Cluster UUIDs for Cluster Alerts.`);
    server.log(['error', monitoringTag], err);

    return [];
  });
}

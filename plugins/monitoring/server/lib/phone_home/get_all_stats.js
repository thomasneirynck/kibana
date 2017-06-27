import { get } from 'lodash';
import { KIBANA_SYSTEM_ID, LOGSTASH_SYSTEM_ID } from '../../../common/constants';
import { getClusterUuids } from './get_cluster_uuids';
import { getElasticsearchStats } from './get_es_stats';
import { getHighLevelStats } from './get_high_level_stats';

/**
 * Get statistics for all products joined by Elasticsearch cluster.
 *
 * @param {Object} req The incoming request
 * @param {Date} start The starting range to request data
 * @param {Date} end The ending range to request data
 * @return {Promise} The array of clusters joined with the Kibana and Logstash instances.
 */
export function getAllStats(req, start, end) {
  const server = req.server;
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('monitoring');
  const callCluster = (...args) => callWithRequest(req, ...args);

  return getAllStatsWithCaller(server, callCluster, start, end);
}

/**
 * Get statistics for all products joined by Elasticsearch cluster.
 *
 * @param {Object} server The server instance used to call ES as the internal user
 * @param {Date} start The starting range to request data
 * @param {Date} end The ending range to request data
 * @return {Promise} The array of clusters joined with the Kibana and Logstash instances.
 */
export function getAllStatsForServer(server, start, end) {
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('monitoring');

  return getAllStatsWithCaller(server, callWithInternalUser, start, end);
}

/**
 * Get statistics for all products joined by Elasticsearch cluster.
 *
 * @param {Object} server The Kibana server instance used to call ES as the internal user
 * @param {function} callCluster The callWithRequest or callWithInternalUser handler
 * @param {Date} start The starting range to request data
 * @param {Date} end The ending range to request data
 * @return {Promise} The array of clusters joined with the Kibana and Logstash instances.
 */
function getAllStatsWithCaller(server, callCluster, start, end) {
  return getClusterUuids(server, callCluster, start, end)
  .then(clusterUuids => {
    // don't bother doing a further lookup
    if (clusterUuids.length === 0) {
      return [];
    }

    return Promise.all([
      getElasticsearchStats(server, callCluster, clusterUuids),
      getHighLevelStats(server, callCluster, clusterUuids, start, end, KIBANA_SYSTEM_ID),
      getHighLevelStats(server, callCluster, clusterUuids, start, end, LOGSTASH_SYSTEM_ID)
    ])
    .then(([esClusters, kibana, logstash]) => handleAllStats(esClusters, { kibana, logstash }));
  });
}

/**
 * Combine the statistics from the stack to create "cluster" stats that associate all products together based on the cluster
 * that is attached.
 *
 * @param {Array} clusters The Elasticsearch clusters
 * @param {Object} kibana The Kibana instances keyed by Cluster UUID
 * @param {Object} logstash The Logstash nodes keyed by Cluster UUID
 * @return {Array} The clusters joined with the Kibana and Logstash instances under each cluster's {@code stack_stats}.
 */
export function handleAllStats(clusters, { kibana, logstash }) {
  return clusters.map(cluster => {
    // if they are using Kibana or Logstash, then add it to the cluster details under cluster.stack_stats
    addStackStats(cluster, kibana, KIBANA_SYSTEM_ID);
    addStackStats(cluster, logstash, LOGSTASH_SYSTEM_ID);

    return cluster;
  });
}

/**
 * Add product data to the {@code cluster}, only if it exists for the current {@code cluster}.
 *
 * @param {Object} cluster The current Elasticsearch cluster stats
 * @param {Object} allProductStats Product stats, keyed by Cluster UUID
 * @param {String} product The product name being added (e.g., 'kibana' or 'logstash')
 */
export function addStackStats(cluster, allProductStats, product) {
  const productStats = get(allProductStats, cluster.cluster_uuid);

  // Don't add it if they're not using (or configured to report stats) this product for this cluster
  if (productStats) {
    if (!cluster.stack_stats) {
      cluster.stack_stats = { };
    }

    cluster.stack_stats[product] = productStats;
  }
}

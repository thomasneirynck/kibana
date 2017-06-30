import { notFound } from 'boom';
import { get, set, findIndex } from 'lodash';
import { getClustersStats } from './get_clusters_stats';
import { flagSupportedClusters } from './flag_supported_clusters';
import { getMlJobsForCluster } from '../elasticsearch/get_ml_jobs';
import { getKibanasForClusters } from '../kibana/get_kibanas_for_clusters';
import { getLogstashForClusters } from '../logstash/get_logstash_for_clusters';
import { calculateOverallStatus } from '../calculate_overall_status';
import { alertsClustersAggregation } from '../../cluster_alerts/alerts_clusters_aggregation';
import { alertsClusterSearch } from '../../cluster_alerts/alerts_cluster_search';
import { checkLicense as checkLicenseForAlerts } from '../../cluster_alerts/check_license';
import { CLUSTER_ALERTS_SEARCH_SIZE } from '../../../common/constants';

// manipulate cluster status and license meta data
export function normalizeClustersData(clusters) {
  clusters.forEach(cluster => {
    cluster.elasticsearch = {
      cluster_stats: cluster.cluster_stats,
      nodes: cluster.nodes,
      indices: cluster.indices
    };
    cluster.status = calculateOverallStatus([
      cluster.elasticsearch.status,
      cluster.kibana && cluster.kibana.status || null
    ]);
    delete cluster.cluster_stats;
    delete cluster.nodes;
    delete cluster.indices;
  });

  return clusters;
}

/*
 * Get ojects for a single cluster (if req.params.clusterUuid) is defined or all clusters
 */
export async function getClustersFromRequest(req) {
  const config = req.server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');
  const kibanaIndexPattern = config.get('xpack.monitoring.kibana.index_pattern');
  const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');
  const clusterUuid = get(req.params, 'clusterUuid');

  let clusters;
  // get clusters with stats and cluster state
  clusters = await getClustersStats(req, esIndexPattern, clusterUuid);

  // TODO: this handling logic should be two different functions
  if (clusterUuid) { // if not undefined, get specific cluster (no need for license checking)
    if (!clusters || clusters.length === 0) {
      throw notFound(`unknown cluster (${clusterUuid}). Check your time range.`);
    }

    const cluster = clusters[0];

    // add ml jobs and alerts data
    cluster.ml = { jobs: await getMlJobsForCluster(req, esIndexPattern, cluster) };
    cluster.alerts = await alertsClusterSearch(req, cluster, checkLicenseForAlerts, { size: CLUSTER_ALERTS_SEARCH_SIZE });
  } else {
    // get all clusters
    if (!clusters || clusters.length === 0) {
      // we do NOT throw 404 here so that the no-data page can use this to check for data
      // we should look at having a standalone function for that lookup
      return [];
    }

    // update clusters with license check results
    const getSupportedClusters = flagSupportedClusters(req);
    clusters = await getSupportedClusters(clusters);

    // add alerts data
    const clustersAlerts = await alertsClustersAggregation(req, clusters, checkLicenseForAlerts);
    clusters.forEach((cluster) => {
      const clusterAlerts = {
        alertsMeta: {
          enabled: clustersAlerts.alertsMeta.enabled,
          message: clustersAlerts.alertsMeta.message // NOTE: this is only defined when the alert feature is disabled
        },
        ...clustersAlerts[cluster.cluster_uuid]
      };
      set(cluster, 'alerts', clusterAlerts);
    });
  }

  // add kibana data
  const kibanas = await getKibanasForClusters(req, kibanaIndexPattern, clusters);
  // add the kibana data to each cluster
  kibanas.forEach(kibana => {
    const clusterIndex = findIndex(clusters, { cluster_uuid: kibana.clusterUuid });
    set(clusters[clusterIndex], 'kibana', kibana.stats);
  });

  // add logstash data
  const logstashes = await getLogstashForClusters(req, logstashIndexPattern, clusters);
  // add the logstash data to each cluster
  logstashes.forEach(logstash => {
    const clusterIndex = findIndex(clusters, { cluster_uuid: logstash.clusterUuid });
    set(clusters[clusterIndex], 'logstash', logstash.stats);
  });

  return normalizeClustersData(clusters);
}

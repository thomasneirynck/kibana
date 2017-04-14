import _ from 'lodash';
import { calculateIndices } from './calculate_indices';
import { getClusters } from './get_clusters';
import { getClustersStats } from './get_clusters_stats';
import { getClustersHealth } from './get_clusters_health';
import { getPrimaryClusterUuid } from './get_primary_cluster_uuid';
import { calculateOverallStatus } from './calculate_overall_status';
import { alertsClustersAggregation } from '../cluster_alerts/alerts_clusters_aggregation';
import { alertsClusterSearch } from '../cluster_alerts/alerts_cluster_search';
import { checkLicense as checkLicenseForAlerts } from '../cluster_alerts/check_license';
import { getClusterLicense } from './get_cluster_license';
import { getKibanasForClusters } from './get_kibanas_for_clusters';
import { getLogstashForClusters } from './logstash/get_logstash_for_clusters';
import { CLUSTER_ALERTS_SEARCH_SIZE } from '../../common/constants';

// manipulate cluster status and license meta data
export function normalizeClustersData(clusters) {
  clusters.forEach(cluster => {
    cluster.elasticsearch = {
      status: cluster.status,
      stats: cluster.stats,
      nodes: cluster.nodes,
      indices: cluster.indices
    };
    cluster.status = calculateOverallStatus([
      cluster.elasticsearch.status,
      cluster.kibana && cluster.kibana.status || null
    ]);
    delete cluster.stats;
    delete cluster.nodes;
    delete cluster.indices;
  });

  // if all clusters are basic, UI will allow the user to get into the primary cluster
  const basicClusters = clusters.filter((cluster) => {
    return cluster.license && cluster.license.type === 'basic';
  });
  if (basicClusters.length === clusters.length) {
    clusters.forEach((cluster) => {
      _.set(cluster, 'allBasicClusters', true);
    });
  }

  return clusters;
}

export function getClustersFromRequest(req) {
  const config = req.server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');
  const kbnIndexPattern = config.get('xpack.monitoring.kibana.index_pattern');
  const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');

  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;

  return Promise.all([
    calculateIndices(req, start, end, esIndexPattern),
    calculateIndices(req, start, end, kbnIndexPattern),
    calculateIndices(req, start, end, logstashIndexPattern)
  ])
  .then(([esIndices, kibanaIndices, logstashIndices]) => {
    return getClusters(req, esIndices)
    .then(getClustersStats(req))
    .then(getClustersHealth(req))
    .then(getPrimaryClusterUuid(req))
    .then((clusters) => {
      if (req.params.clusterUuid) {
        return alertsClusterSearch(req, req.params.clusterUuid, getClusterLicense, checkLicenseForAlerts, {
          size: CLUSTER_ALERTS_SEARCH_SIZE
        })
        .then((alerts) => {
          _.set(clusters, '[0].alerts', alerts);
          return clusters;
        });
      } else {
        return alertsClustersAggregation(req, clusters, checkLicenseForAlerts)
        .then((alerts) => {
          clusters.forEach((cluster) => {
            cluster.alerts = alerts[cluster.cluster_uuid];
          });
          return clusters;
        });
      }
    })
    .then(clusters => {
      const mapClusters = getKibanasForClusters(req, kibanaIndices);
      return mapClusters(clusters)
      .then(kibanas => {
        // add the kibana data to each cluster
        kibanas.forEach(kibana => {
          const clusterIndex = _.findIndex(clusters, { cluster_uuid: kibana.clusterUuid });
          _.set(clusters[clusterIndex], 'kibana', kibana.stats);
        });
        return clusters;
      });
    })
    .then(clusters => {
      const mapClusters = getLogstashForClusters(req, logstashIndices);
      return mapClusters(clusters)
      .then(logstashes => {
        // add the logstash data to each cluster
        logstashes.forEach(logstash => {
          const clusterIndex = _.findIndex(clusters, { cluster_uuid: logstash.clusterUuid });
          _.set(clusters[clusterIndex], 'logstash', logstash.stats);
        });
        return clusters;
      });
    })
    .then(clusters => normalizeClustersData(clusters))
    .then(clusters => _.sortBy(clusters, 'cluster_name'));
  });
  // reply() and catch() is handled by the caller
}

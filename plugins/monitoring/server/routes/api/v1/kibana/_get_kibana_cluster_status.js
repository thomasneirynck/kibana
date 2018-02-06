import { get } from 'lodash';
import { getKibanasForClusters } from '../../../../lib/kibana/get_kibanas_for_clusters';

export const getKibanaClusterStatus = (req, kbnIndexPattern, { clusterUuid }) => {
  const clusters = [{ cluster_uuid: clusterUuid }];
  return getKibanasForClusters(req, kbnIndexPattern, clusters)
    .then(kibanas => get(kibanas, '[0].stats'));
};

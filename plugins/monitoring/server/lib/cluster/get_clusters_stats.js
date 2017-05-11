import { get } from 'lodash';
import Promise from 'bluebird';
import { createTypeFilter } from '../create_query';

/*
 * @param req: server's request object
 * @return array of cluster objects with .stats field added
 */
export function getClustersStats(req, esIndexPattern) {
  return (clusters) => {
    // in case getClusters had no hits and returned undefined
    if (!clusters) { return []; }

    return Promise.map(clusters, (cluster) => {
      const params = {
        index: esIndexPattern,
        ignore: [404],
        body: {
          size: 1,
          sort: [ { timestamp: 'desc' } ],
          query: {
            bool: {
              filter: [
                { ...createTypeFilter('cluster_stats') },
                { term: { cluster_uuid: cluster.cluster_uuid } }
              ]
            }
          }
        }
      };

      const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
      return callWithRequest(req, 'search', params)
        .then((resp) => {
          if (resp.hits.total) {
            cluster.stats = get(resp.hits.hits[0], '_source.cluster_stats');
          }
          return cluster;
        });
    });
  };
};

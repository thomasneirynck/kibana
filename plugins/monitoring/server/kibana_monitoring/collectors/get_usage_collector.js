import { get, snakeCase } from 'lodash';
import { KIBANA_USAGE_TYPE } from '../../../common/constants';
import { BasicCredentials } from '../../../../security/server/lib/authentication/providers/basic';

export function handleAdvancedStatsResponse(response) {
  const buckets = get(response, 'aggregations.types.buckets', []);

  const initial = {
    graph_workspace: { total: 0 },
    timelion_sheet: { total: 0 },
  };

  return buckets.reduce((accum, bucket) => {
    const key = snakeCase(bucket.key);
    return {
      ...accum,
      [key]: { total: bucket.doc_count },
    };
  }, initial);
}

export function getKibanaAdvancedStats(callCluster, kibanaIndex) {
  const advancedStatsParams = {
    index: kibanaIndex,
    filterPath: 'aggregations.types.buckets',
    body: {
      size: 0,
      query: {
        bool: {
          should: [
            { term: { type: { value: 'graph-workspace' } } },
            { term: { type: { value: 'timelion-sheet' } } }
          ]
        }
      },
      aggs: {
        types: {
          terms: {
            field: 'type',
            size: 2,
          }
        }
      }
    }
  };

  return callCluster('search', advancedStatsParams)
  .then(handleAdvancedStatsResponse);
}

/**
 * Combines saved object client stas from server.getKibanaStats
 * with "advanced" stats that come from querying the .kibana index directly
 */
export function getUsageCollector(server, config) {
  let fakeRequest = { headers: {} };

  const username = config.get('elasticsearch.username');
  const password = config.get('elasticsearch.password');
  if (username && password) {
    fakeRequest = BasicCredentials.decorateRequest(fakeRequest, username, password);
  }

  const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');
  const callCluster = (...args) => callWithRequest(fakeRequest, ...args);

  return {
    type: KIBANA_USAGE_TYPE,
    async fetch() {
      const stats = await server.getKibanaStats({ callCluster });
      const advanced = await getKibanaAdvancedStats(callCluster, stats.index);

      stats.visualization = {
        ...stats.visualization,
        ...advanced.visualization,
      };

      delete advanced.visualization;

      return {
        ...stats,
        ...advanced,
      };
    }
  };
}

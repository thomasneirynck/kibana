import { KIBANA_USAGE_TYPE } from '../../common/constants';
import { getAuthHeader } from '../../../security/server/lib/basic_auth';

const STATS_ENDPOINT = '/api/stats';

/*
 * Use HapiJS server.inject to call the Kibana stats API
 * Note: `inject` simulates an API call without the overhead of a network
 * stack, and it even avoids creating a new socket connection if possible
 */
export function getUsageCollector(server, config) {
  const username = config.get('elasticsearch.username');
  const password = config.get('elasticsearch.password');
  const injectOptions = {
    method: 'GET',
    url: STATS_ENDPOINT,
    headers: getAuthHeader(username, password)
  };

  return {
    type: KIBANA_USAGE_TYPE,
    fetch() {
      return server.inject(injectOptions)
      .then(({ statusCode, result }) => {
        if (statusCode === 200) {
          return result;
        }
        // unexpected response - log the status code
        throw new Error(`Kibana Stats API call failed! Status code: ${statusCode}`);
      });
    }
  };
};

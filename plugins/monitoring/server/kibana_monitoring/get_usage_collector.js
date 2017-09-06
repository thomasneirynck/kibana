import { KIBANA_USAGE_TYPE } from '../../common/constants';
import { BasicCredentials } from '../../../security/server/lib/authentication/providers/basic';

/*
 * Use HapiJS server.inject to call the Kibana stats API
 * Note: `inject` simulates an API call without the overhead of a network
 * stack, and it even avoids creating a new socket connection if possible
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
    fetch() {
      return server.getKibanaStats({ callCluster });
    }
  };
}

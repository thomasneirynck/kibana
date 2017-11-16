import { KIBANA_REPORTING_TYPE } from '../../../common/constants';
import { BasicCredentials } from '../../../../security/server/lib/authentication/providers/basic';
import { getReportingUsage } from '../../../../reporting';

export function getReportingCollector(server, config) {
  let fakeRequest = { headers: {} };

  const username = config.get('elasticsearch.username');
  const password = config.get('elasticsearch.password');
  if (username && password) {
    fakeRequest = BasicCredentials.decorateRequest(fakeRequest, username, password);
  }

  const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');
  const callCluster = (...args) => callWithRequest(fakeRequest, ...args);

  return {
    type: KIBANA_REPORTING_TYPE,
    fetch() {
      return getReportingUsage(callCluster, server);
    }
  };
}

import { get } from 'lodash';
import { LOGGING_TAG, KIBANA_MONITORING_LOGGING_TAG, } from '../../common/constants';
import { monitoringBulk } from './lib/monitoring_bulk';
import { startCollector } from './start_collector';

/**
 * @param kbnServer {Object} manager of Kibana services - see `src/server/kbn_server` in Kibana core
 * @param server {Object} HapiJS server instance
 */
export async function initKibanaMonitoring(kbnServer, server) {
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');

  let xpackInfo;
  try {
    xpackInfo = await callWithInternalUser('transport.request', {
      method: 'GET',
      path: '/_xpack'
    });
  } catch(err) {
    server.log(
      ['error', LOGGING_TAG, KIBANA_MONITORING_LOGGING_TAG],
      'Unable to retrieve X-Pack info. Kibana monitoring will be disabled.'
    );
  }

  const isEnabledInAdminCluster = get(xpackInfo, 'features.monitoring.enabled', false);
  if (isEnabledInAdminCluster) {
    const client = server.plugins.elasticsearch.getCluster('admin').createClient({
      plugins: [monitoringBulk]
    });

    startCollector(kbnServer, server, client);
  }
}

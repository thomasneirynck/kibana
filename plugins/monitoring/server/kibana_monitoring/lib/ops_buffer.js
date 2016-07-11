import {
  MONITORING_SYSTEM_API_VERSION, KIBANA_SYSTEM_ID, KIBANA_STATS_TYPE
} from '../../../lib/constants';
import _ from 'lodash';
import mapEvent from './map_event';
import monitoringBulk from './monitoring_bulk';

export default function opsBuffer(serverInfo, server) {
  const queue = [];
  const client = server.plugins.elasticsearch.createClient({
    plugins: [monitoringBulk]
  });
  return {
    push(event) {
      const config = server.config();
      const payload = mapEvent(event, config, serverInfo);
      return queue.push({ index: {_type: KIBANA_STATS_TYPE}}, payload);
    },
    flush() {
      if (!queue.length) return;
      const config = server.config();
      const lastOp = queue[queue.length - 1];
      const body = queue.splice(0);

      //Push the latest ops data to .monitoring-data
      body.push({
        index: {
          _index: '_data',
          _type: KIBANA_SYSTEM_ID,
          _id: _.get(lastOp, 'kibana.uuid')
        }
      }, lastOp);
      return client.monitoring.bulk({
        system_id: KIBANA_SYSTEM_ID,
        system_api_version: MONITORING_SYSTEM_API_VERSION,
        body
      })
      .catch((err) => {
        const monitoringTag = config.get('xpack.monitoring.loggingTag');
        server.log(['error', monitoringTag], err);
      });
    }
  };
}

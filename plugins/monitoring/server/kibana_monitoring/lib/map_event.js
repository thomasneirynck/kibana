import mapRequests from './map_requests';
import mapPlugins from './map_plugins';
import mapResponseTimes from './map_response_times';
import mapConcurrents from './map_concurrent_connections';
import v8 from 'v8';

import moment from 'moment';
import _ from 'lodash';

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

const snapshotRegex = /-snapshot/i;
export default function mapEvent(event, config, serverInfo) {
  const status = serverInfo.status.toJSON();
  const heapStatistics = v8.getHeapStatistics();
  const heapSizeLimit = heapStatistics.heap_size_limit;
  return {
    kibana: {
      uuid: config.get('uuid'),
      name: config.get('server.name'),
      host: event.host,
      transport_address: `${config.get('server.host')}:${config.get('server.port')}`,
      version: serverInfo.version.replace(snapshotRegex, ''),
      snapshot: snapshotRegex.test(serverInfo.version),
      status: _.get(status, 'overall.state'),
      statuses: mapPlugins(status.statuses)
    },
    os: {
      load: {
        '1m': event.osload[0],
        '5m': event.osload[1],
        '15m': event.osload[2]
      },
      memory: {
        total_in_bytes: event.osmem.total,
        free_in_bytes: event.osmem.free,
        used_in_bytes: event.osmem.total - event.osmem.free
      },
      uptime_in_millis: secondsToMilliseconds(event.osup)
    },
    process: {
      memory: {
        heap: {
          total_in_bytes: event.psmem.heapTotal,
          used_in_bytes: event.psmem.heapUsed,
          size_limit: heapSizeLimit
        },
        resident_set_size_in_bytes: event.psmem.rss
      },
      event_loop_delay: event.psdelay,
      uptime_in_millis: secondsToMilliseconds(event.psup)
    },
    sockets: event.sockets,
    timestamp: moment.utc().toISOString(),
    requests: mapRequests(event.requests),
    response_times: mapResponseTimes(event.responseTimes),
    concurrent_connections: mapConcurrents(event.concurrents)
  };
}

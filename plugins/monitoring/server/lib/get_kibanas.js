/*
 * Get detailed info for Kibanas in the cluster
 * for Kibana listing page
 * For each instance:
 *  - name
 *  - status
 *  - memory
 *  - os load average
 *  - requests
 *  - response times
 */
import { get, isArray } from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import createQuery from './create_query';
import calculateAvailability from './calculate_availability';

export default function getKibanas(req, indices) {
  if (indices.length < 1) return Promise.resolve([]);

  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const uuid = req.params.clusterUuid;

  const metric = { timestampField: 'timestamp', uuidField: 'cluster_uuid' };
  const params = {
    index: indices,
    type: 'kibana_stats',
    meta: 'get_kibanas',
    ignore: [404],
    body: {
      size: 0,
      query: createQuery({ start, end, uuid, metric }),
      aggs: {
        kibana_uuids: {
          terms: {
            field: 'kibana_stats.kibana.uuid'
          }
        }
      }
    }
  };
  return callWithRequest(req, 'search', params)
  .then(statsResp => {
    const statsBuckets = get(statsResp, 'aggregations.kibana_uuids.buckets');
    if (isArray(statsBuckets)) {
      return Promise.map(statsBuckets, (uuidBucket) => {
        const infoParams = {
          index: config.get('xpack.monitoring.index'),
          type: 'kibana',
          meta: 'get_kibanas_kibana_info',
          id: uuidBucket.key,
          _source: [
            'timestamp',
            'kibana.process.memory.resident_set_size_in_bytes',
            'kibana.os.load.1m',
            'kibana.response_times.average',
            'kibana.response_times.max',
            'kibana.requests.total',
            'kibana.kibana.transport_address',
            'kibana.kibana.name',
            'kibana.kibana.host',
            'kibana.kibana.uuid',
            'kibana.kibana.status',
            'kibana.concurrent_connections'
          ]
        };

        return callWithRequest(req, 'get', infoParams)
        .then(infoResp => {
          return {
            ...get(infoResp, '_source.kibana'),
            availability: calculateAvailability(get(infoResp, '_source.timestamp'))
          };
        });
      });
    }
  });
};

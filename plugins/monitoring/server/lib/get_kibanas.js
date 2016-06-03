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
import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import createQuery from './create_query';
import calculateAvailability from './calculate_availability';

export default function getKibanas(req, indices) {
  if (indices[0] === '.kibana-devnull') return Promise.resolve([]);

  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const clusterUuid = req.params.clusterUuid;

  const params = {
    index: indices,
    type: 'kibana_stats',
    meta: 'get_kibanas',
    ignore: [404],
    body: {
      size: 0,
      query: createQuery({ start, end, clusterUuid }),
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
    const statsBuckets = _.get(statsResp, 'aggregations.kibana_uuids.buckets');
    if (_.isArray(statsBuckets)) {
      return Promise.map(statsBuckets, (uuidBucket) => {
        const infoParams = {
          index: config.get('xpack.monitoring.index'),
          type: 'kibana',
          meta: 'get_kibanas_kibana_info',
          id: uuidBucket.key
        };

        return callWithRequest(req, 'get', infoParams)
        .then(infoResp => {
          const availability = {
            availability: calculateAvailability(_.get(infoResp, '_source.timestamp'))
          };
          // clean up the response data payloads
          const listingFields = [
            'kibana',
            'os',
            'process',
            'requests',
            'response_times',
            'concurrent_connections'
          ];
          const info = _.pick(_.get(infoResp, '_source.kibana'), listingFields);
          return {
            ...info,
            ...availability
          };
        });
      });
    }
  });
};

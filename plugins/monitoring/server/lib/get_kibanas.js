import _ from 'lodash';
import moment from 'moment';
import createQuery from './create_query';
import Promise from 'bluebird';

export default function getKibanas(req, indices) {
  if (indices[0] === '.kibana-devnull') return Promise.resolve([]);

  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();

  const params = {
    index: indices,
    type: 'kibana_stats',
    meta: 'get_kibana_stats',
    ignore: [404],
    body: {
      size: 0,
      query: createQuery({
        start,
        end
      }),
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
          meta: 'get_kibana_info',
          id: uuidBucket.key
        };

        return callWithRequest(req, 'get', infoParams)
        .then(infoResp => {
          return _.get(infoResp, '_source.kibana');
        });
      });
    }
  });
};

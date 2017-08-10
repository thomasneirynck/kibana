/* eslint-disable no-shadow */

import {
  APP_NAME,
  TRANSACTION_DURATION,
  TRANSACTION_TYPE
} from '../../../common/constants';
import { get } from 'lodash';
export async function getApps(req) {
  const { start, end, client, intervalString, config } = req.pre.setup;
  const { query } = req.query;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            {
              range: {
                '@timestamp': {
                  gte: start,
                  lte: end,
                  format: 'epoch_millis'
                }
              }
            }
          ]
        }
      },
      aggs: {
        apps: {
          terms: {
            field: APP_NAME,
            size: 100
          },
          aggs: {
            avg: {
              avg: { field: TRANSACTION_DURATION }
            },
            types: {
              terms: { field: TRANSACTION_TYPE, size: 100 },
              aggs: {
                avg: {
                  avg: { field: TRANSACTION_DURATION }
                },
                timeseries: {
                  date_histogram: {
                    field: '@timestamp',
                    interval: intervalString,
                    extended_bounds: {
                      min: start,
                      max: end
                    }
                  },
                  aggs: {
                    avg: {
                      avg: { field: TRANSACTION_DURATION }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  if (query) {
    params.body.query.bool.must.push({
      query_string: { query }
    });
  }

  const resp = await client('search', params);
  const buckets = get(resp, 'aggregations.apps.buckets', []);
  return buckets.map(bucket => {
    return {
      app_name: bucket.key,
      overall_avg: get(bucket, 'avg.value', 0) || 0,
      types: get(bucket, 'types.buckets', []).map(bucket => bucket.key),
      chart: get(bucket, 'types.buckets', []).reduce((acc, bucket) => {
        acc[bucket.key] = get(bucket, 'timeseries.buckets').map(bucket => {
          return [bucket.key_as_string, bucket.avg.value || 0];
        });
        return acc;
      }, {})
    };
  });
}

import {
  APP_NAME,
  TRANSACTION_DURATION,
  TRANSACTION_TYPE
} from '../../../common/constants';

import { getBucketSize } from '../helpers/get_bucket_size';

export async function getApp({ appName, setup }) {
  const { start, end, client, config } = setup;
  const { intervalString } = getBucketSize(start, end, '1m');

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { [APP_NAME]: appName } },
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
  };

  const resp = await client('search', params);

  const { types } = resp.aggregations;

  return {
    app_name: appName,
    types: types.buckets.map(bucket => bucket.key)
  };
}

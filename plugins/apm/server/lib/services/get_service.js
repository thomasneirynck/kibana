import {
  SERVICE_NAME,
  TRANSACTION_DURATION,
  TRANSACTION_TYPE
} from '../../../common/constants';

import { getBucketSize } from '../helpers/get_bucket_size';

export async function getService({ serviceName, setup }) {
  const { start, end, client, config } = setup;
  const { intervalString } = getBucketSize(start, end, 'auto');

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { [SERVICE_NAME]: serviceName } },
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
    service_name: serviceName,
    types: types.buckets.map(bucket => bucket.key)
  };
}

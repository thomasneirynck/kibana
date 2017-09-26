import { APP_NAME, ERROR_GROUP_ID } from '../../../../common/constants';

export async function getBuckets({ appName, groupId, bucketSize, setup }) {
  const { start, end, client, config } = setup;

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
            },
            { term: { [ERROR_GROUP_ID]: groupId } },
            { term: { [APP_NAME]: appName } }
          ]
        }
      },
      aggs: {
        distribution: {
          histogram: {
            field: '@timestamp',
            min_doc_count: 0,
            interval: bucketSize,
            extended_bounds: {
              min: start,
              max: end
            }
          }
        }
      }
    }
  };

  const resp = await client('search', params);

  return resp.aggregations.distribution.buckets.map(bucket => ({
    key: bucket.key,
    count: bucket.doc_count
  }));
}

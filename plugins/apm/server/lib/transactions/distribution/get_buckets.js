import { get } from 'lodash';
import {
  APP_NAME,
  TRANSACTION_DURATION,
  TRANSACTION_ID,
  TRANSACTION_NAME
} from '../../../../common/constants';

export async function getBuckets({
  appName,
  transactionName,
  bucketSize = 100,
  setup
}) {
  const { start, end, client, config } = setup;

  const bucketTargetCount = config.get('xpack.apm.bucketTargetCount');

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
            { term: { [APP_NAME]: appName } },
            { term: { [`${TRANSACTION_NAME}.keyword`]: transactionName } }
          ]
        }
      },
      aggs: {
        distribution: {
          histogram: {
            field: TRANSACTION_DURATION,
            interval: bucketSize,
            min_doc_count: 0,
            extended_bounds: {
              min: 0,
              max: bucketSize * bucketTargetCount
            }
          },
          aggs: {
            sample: {
              top_hits: {
                _source: [TRANSACTION_ID],
                size: 1
              }
            }
          }
        }
      }
    }
  };

  const resp = await client('search', params);

  return resp.aggregations.distribution.buckets.map(bucket => ({
    key: bucket.key,
    count: bucket.doc_count,
    transaction_id: get(bucket.sample.hits.hits[0], `_source.${TRANSACTION_ID}`)
  }));
}

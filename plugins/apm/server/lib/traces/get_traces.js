import { get } from 'lodash';
import {
  TRACE_TRANSACTION_ID,
  TRACE_START,
  TRACE_TYPE
} from '../../../common/constants';
async function getTraces(req) {
  const { start, end, client, config } = req.pre.setup;
  const { transaction_id: transactionId } = req.query;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 500,
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
            {
              term: { [TRACE_TRANSACTION_ID]: transactionId }
            }
          ]
        }
      },
      sort: [{ [TRACE_START]: { order: 'asc' } }],
      aggs: {
        types: {
          terms: {
            field: TRACE_TYPE,
            size: 100
          }
        }
      }
    }
  };

  const resp = await client('search', params);

  return {
    trace_types: get(resp, 'aggregations.types.buckets', []).map(bucket => {
      return { type: bucket.key, count: bucket.doc_count };
    }),
    traces: get(resp, 'hits.hits').map((doc, i) => ({
      id: i,
      ...doc._source.trace,
      context: doc._source.context
    }))
  };
}

export default getTraces;

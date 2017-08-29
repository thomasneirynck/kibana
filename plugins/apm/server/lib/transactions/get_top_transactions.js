import moment from 'moment';
import {
  APP_NAME,
  TRANSACTION_TYPE,
  TRANSACTION_NAME,
  TRANSACTION_ID,
  TRANSACTION_DURATION
} from '../../../common/constants';
import { get, sortBy } from 'lodash';
export async function getTopTransactions(req) {
  const { appName } = req.params;
  const { query } = req.query;
  const transactionType = req.query.transaction_type;
  const { start, end, client, config } = req.pre.setup;
  const duration = moment.duration(end - start);
  const minutes = duration.asMinutes();

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            {
              term: {
                [APP_NAME]: appName
              }
            },
            {
              term: {
                [TRANSACTION_TYPE]: transactionType
              }
            },
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
        transactions: {
          terms: {
            field: `${TRANSACTION_NAME}.keyword`,
            order: { avg: 'desc' },
            size: 10000
          },
          aggs: {
            sample: {
              top_hits: {
                _source: [TRANSACTION_ID],
                size: 1,
                sort: [{ '@timestamp': { order: 'desc' } }]
              }
            },
            avg: {
              avg: { field: TRANSACTION_DURATION }
            },
            p95: {
              percentiles: {
                field: TRANSACTION_DURATION,
                percents: [95]
              }
            }
          }
        }
      }
    }
  };

  if (query) {
    params.body.query.bool.must.push({
      query_string: { default_field: TRANSACTION_NAME, query }
    });
  }
  const resp = await client('search', params);
  const buckets = get(resp, 'aggregations.transactions.buckets', []);
  const results = buckets.map(bucket => {
    const avg = bucket.avg.value;
    const rpm = bucket.doc_count / minutes;
    const impact = Math.round(avg * rpm);
    return {
      name: bucket.key,
      id: get(bucket, `sample.hits.hits[0]._source.${TRANSACTION_ID}`),
      p95: bucket.p95.values['95.0'],
      avg,
      rpm,
      impact,
      transaction_type: transactionType
    };
  });

  // Sort results by impact - needs to be desc, hence the reverse()
  return sortBy(results, o => o.impact).reverse();
}

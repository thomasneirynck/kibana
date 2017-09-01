import { get } from 'lodash';
import {
  TRANSACTION_ID,
  TRANSACTION_DURATION
} from '../../../common/constants';

export async function getTransactionDuration(req) {
  const { transactionId } = req.params;
  const { start, end, client, config } = req.pre.setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 1,
      _source: TRANSACTION_DURATION,
      query: {
        bool: {
          must: [
            { term: { [TRANSACTION_ID]: transactionId } },
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
      }
    }
  };

  const resp = await client('search', params);
  return get(
    resp.hits.hits.find(doc => doc._source.transaction),
    `_source[${TRANSACTION_DURATION}]`
  );
}

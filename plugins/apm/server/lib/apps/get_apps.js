import {
  APP_NAME,
  TRANSACTION_DURATION,
  APP_AGENT_NAME,
  EVENT_PROCESSOR_NAME
} from '../../../common/constants';
import { get } from 'lodash';

export async function getApps({ setup }) {
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
            }
          ]
        }
      },
      aggs: {
        apps: {
          terms: {
            field: APP_NAME,
            size: 500
          },
          aggs: {
            avg: {
              avg: { field: TRANSACTION_DURATION }
            },
            agents: {
              terms: { field: APP_AGENT_NAME, size: 1 }
            },
            events: {
              terms: { field: EVENT_PROCESSOR_NAME, size: 2 }
            }
          }
        }
      }
    }
  };

  const resp = await client('search', params);

  const buckets = get(resp.aggregations, 'apps.buckets', []);
  return buckets.map(bucket => {
    const eventTypes = bucket.events.buckets;

    const transactions = eventTypes.find(e => e.key === 'transaction');
    const totalTransactions = get(transactions, 'doc_count', 0);

    const errors = eventTypes.find(e => e.key === 'error');
    const totalErrors = get(errors, 'doc_count', 0);

    const deltaAsMinutes = (end - start) / 1000 / 60;

    const transactionsPerMinute = totalTransactions / deltaAsMinutes;
    const errorsPerMinute = totalErrors / deltaAsMinutes;

    return {
      app_name: bucket.key,
      agent_name: get(bucket, 'agents.buckets[0].key', null),
      transactions_per_minute: transactionsPerMinute,
      errors_per_minute: errorsPerMinute,
      avg_response_time: bucket.avg.value
    };
  });
}

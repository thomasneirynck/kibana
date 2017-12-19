import {
  SERVICE_NAME,
  ERROR_GROUP_ID,
  ERROR_CULPRIT,
  ERROR_EXC_MESSAGE,
  ERROR_LOG_MESSAGE,
  PROCESSOR_EVENT
} from '../../../common/constants';
import { get } from 'lodash';

export async function getErrors({ serviceName, setup }) {
  const { start, end, client, config } = setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 100,
      query: {
        bool: {
          must: [
            { term: { [SERVICE_NAME]: serviceName } },
            { term: { [PROCESSOR_EVENT]: 'error' } },
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
      collapse: {
        field: ERROR_GROUP_ID,
        inner_hits: {
          name: 'occurrences',
          size: 0
        }
      },
      sort: [
        {
          '@timestamp': 'desc'
        }
      ]
    }
  };

  const resp = await client('search', params);
  const hits = get(resp, 'hits.hits', []);

  return hits.map(hit => {
    const message =
      get(hit, `_source.${ERROR_LOG_MESSAGE}`) ||
      get(hit, `_source.${ERROR_EXC_MESSAGE}`);

    return {
      culprit: get(hit, `_source.${ERROR_CULPRIT}`),
      message: message,
      group_id: get(hit, `_source.${ERROR_GROUP_ID}`),
      occurrence_count: get(hit, `inner_hits.occurrences.hits.total`),
      latest_occurrence_at: get(hit, `_source.@timestamp`)
    };
  });
}

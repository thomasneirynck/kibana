import {
  APP_NAME,
  ERROR_GROUP_ID,
  ERROR_CULPRIT,
  ERROR_MESSAGE,
  PROCESSOR_EVENT
} from '../../../common/constants';
import { get } from 'lodash';

export async function getErrors({ appName, setup }) {
  const { start, end, client, config } = setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 100,
      query: {
        bool: {
          must: [
            { term: { [APP_NAME]: appName } },
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
    return {
      culprit: get(hit, `_source.${ERROR_CULPRIT}`),
      message: get(hit, `_source.${ERROR_MESSAGE}`),
      group_id: get(hit, `_source.${ERROR_GROUP_ID}`),
      occurrence_count: get(hit, `inner_hits.occurrences.hits.total`),
      latest_occurrence_at: get(hit, `_source.@timestamp`)
    };
  });
}

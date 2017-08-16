/* eslint-disable no-shadow */

import {
  APP_NAME,
  ERROR_GROUPING_ID,
  ERROR_CULPRIT,
  ERROR_MESSAGE
} from '../../../common/constants';
import { get } from 'lodash';
export async function getErrors(req) {
  const { appName } = req.params;
  const { start, end, client, config } = req.pre.setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
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
                'processor.event': 'error'
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
      collapse: {
        field: ERROR_GROUPING_ID,
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
      grouping_id: get(hit, `_source.${ERROR_GROUPING_ID}`),
      occurrence_count: get(hit, `inner_hits.occurrences.hits.total`)
    };
  });
}

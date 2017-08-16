/* eslint-disable no-shadow */

import { APP_NAME, ERROR_GROUPING_ID } from '../../../common/constants';
import { get } from 'lodash';
export async function getErrorGroup(req) {
  const { appName } = req.params;
  const { groupingId } = req.params;
  const { start, end, client, config } = req.pre.setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 1,
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
                [ERROR_GROUPING_ID]: groupingId
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
      sort: [
        {
          '@timestamp': 'desc'
        }
      ]
    }
  };

  const resp = await client('search', params);

  return {
    error: get(resp, 'hits.hits[0]._source', {}),
    occurrences_count: get(resp, 'hits.total'),
    grouping_id: get(resp, `hits.hits[0]._source.${ERROR_GROUPING_ID}`)
  };
}

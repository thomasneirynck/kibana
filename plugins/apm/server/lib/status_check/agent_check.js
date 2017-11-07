import { EVENT_PROCESSOR_NAME } from '../../../common/constants';

export async function getAgentStatus({ setup }) {
  const { client, config } = setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: {
            exists: {
              field: EVENT_PROCESSOR_NAME
            }
          }
        }
      }
    }
  };

  const resp = await client('search', params);

  return {
    data_found: resp.hits.total >= 1
  };
}

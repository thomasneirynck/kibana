import { handleResponse } from '../get_beats_for_clusters';
import expect from 'expect.js';

describe('get_beats_for_clusters', () => {
  it('Handles empty aggregation', () => {
    const clusterUuid = 'foo_uuid';
    const response = {
    };
    expect(handleResponse(clusterUuid, response)).to.eql({
      clusterUuid: 'foo_uuid',
      stats: {
        publishedEvents: undefined,
        bytesSent: undefined,
        beats: {
          total: undefined,
          types: [],
        }
      }
    });
  });

  it('Combines stats', () => {
    const clusterUuid = 'foo_uuid';
    const response = {
      aggregations: {
        total: {
          value: 1400
        },
        types: {
          buckets: [
            { key: 'filebeat', uuids: { buckets: new Array(1000) } },
            { key: 'metricbeat', uuids: { buckets: new Array(1200) } },
          ]
        },
        events_published_sum_upper_bound: {
          value: 80000
        },
        bytes_sent_sum_upper_bound: {
          value: 500000
        }
      }
    };
    expect(handleResponse(clusterUuid, response)).to.eql({
      clusterUuid: 'foo_uuid',
      stats: {
        publishedEvents: 80000,
        bytesSent: 500000,
        beats: {
          total: 1400,
          types: [
            {
              count: 1000,
              type: 'Filebeat',
            },
            {
              count: 1200,
              type: 'Metricbeat',
            }
          ],
        }
      }
    });
  });
});

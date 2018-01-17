import { handleResponse } from '../get_stats';
import expect from 'expect.js';

describe('beats/get_stats', () => {
  it('Handle empty response', () => {
    expect(handleResponse()).to.eql({
      stats: {
        bytesSent: undefined,
        publishedEvents: undefined
      },
      total: undefined,
      types: []
    });
  });

  it('Summarizes response data', () => {
    const response = {
      aggregations: {
        total: { value: 2200 },
        types: {
          buckets: [
            { key: 'filebeat', uuids: { buckets: new Array(1000) } },
            { key: 'metricbeat', uuids: { buckets: new Array(1200) } }
          ]
        },
        events_published_sum_upper_bound: { value: 293476 },
        bytes_sent_sum_upper_bound: { value: 83472836 }
      }
    };

    expect(handleResponse(response)).to.eql({
      stats: {
        bytesSent: 83472836,
        publishedEvents: 293476
      },
      total: 2200,
      types: [
        { type: 'Filebeat', count: 1000 },
        { type: 'Metricbeat', count: 1200 }
      ]
    });
  });
});

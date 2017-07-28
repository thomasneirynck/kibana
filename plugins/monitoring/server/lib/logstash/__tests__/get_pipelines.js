import expect from 'expect.js';
import { _handleResponse } from '../get_pipelines';

describe('get_pipelines', () => {
  let responseFromEs;
  let timespanInSeconds;

  describe('response from ES is empty', () => {
    it ('returns an empty array', () => {
      const result = _handleResponse(responseFromEs, timespanInSeconds);
      expect(result).to.eql([]);
    });
  });

  describe('response from ES is non-empty', () => {
    beforeEach(() => {
      responseFromEs = {
        aggregations: {
          pipelines: {
            by_pipeline_id: {
              buckets: [
                {
                  key: 'main',
                  by_pipeline_hash: {
                    buckets: [
                      {
                        key: 'abcdef1',
                        throughput: { value: 2400 },
                        duration_in_millis: { value: 600 },
                        path_to_root: {
                          last_seen: { value: 1500920925471 }
                        }
                      },
                      {
                        key: 'abcdef2',
                        duration_in_millis: { value: 90 },
                        path_to_root: {
                          last_seen: { value: 1500920946113 }
                        }
                      }
                    ]
                  }
                },
                {
                  key: 'shipper',
                  by_pipeline_hash: {
                    buckets: [
                      {
                        key: 'deadbeef',
                        throughput: { value: 200 },
                        path_to_root: {
                          last_seen: { value: 1500920967692 }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      };

      timespanInSeconds = 100;
    });

    it ('returns the correct structure for a non-empty response', () => {
      const result = _handleResponse(responseFromEs, timespanInSeconds);
      expect(result).to.eql([
        {
          id: 'main',
          hashes: [
            {
              hash: 'abcdef1',
              eventsPerSecond: 24,
              eventLatencyInMs: 0.25,
              lastSeen: 1500920925471
            },
            {
              hash: 'abcdef2',
              eventsPerSecond: null,
              eventLatencyInMs: null,
              lastSeen: 1500920946113
            }
          ]
        },
        {
          id: 'shipper',
          hashes: [
            {
              hash: 'deadbeef',
              eventsPerSecond: 2,
              eventLatencyInMs: null,
              lastSeen: 1500920967692
            }
          ]
        }
      ]);
    });
  });
});
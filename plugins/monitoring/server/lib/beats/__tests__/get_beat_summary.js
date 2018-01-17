import { handleResponse } from '../get_beat_summary';
import expect from 'expect.js';

describe('get_beat_summary', () => {
  it('Handles empty aggregation', () => {
    const response = {};
    const beatUuid = 'fooUuid';

    expect(handleResponse(response, beatUuid)).to.eql({
      uuid: 'fooUuid',
      transportAddress: undefined,
      version: undefined,
      name: undefined,
      type: '',
      output: '',
      eventsPublished: undefined,
      eventsDropped: undefined,
      eventsEmitted: undefined,
      bytesWritten: undefined,
      configReloads: undefined,
      uptime: undefined,
    });
  });

  it('Returns summarized data', () => {
    const response = {
      hits: {
        hits: [
          {
            _source: {
              beats_stats: {
                beat: {
                  host: 'beat-summary.test',
                  name: 'beat-summary.test-0101',
                  type: 'filebeat',
                  version: '6.2.0',
                },
                metrics: {
                  beat: {
                    info: {
                      ['uptime.ms']: 32 * 1000 * 1000 * 1000,
                    }
                  },
                  libbeat: {
                    output: {
                      type: 'kafka',
                      write: {
                        bytes: 293845923,
                      }
                    },
                    pipeline: {
                      events: {
                        published: 2300,
                        total: 2320,
                        dropped: 1,
                      }
                    },
                    config: {
                      reloads: 17
                    }
                  }
                }
              }
            }
          }
        ]
      }
    };
    const beatUuid = 'fooUuid';

    expect(handleResponse(response, beatUuid)).to.eql({
      uuid: 'fooUuid',
      transportAddress: 'beat-summary.test',
      version: '6.2.0',
      name: 'beat-summary.test-0101',
      type: 'Filebeat',
      output: 'Kafka',
      eventsPublished: 2300,
      eventsDropped: 1,
      eventsEmitted: 2320,
      bytesWritten: 293845923,
      configReloads: 17,
      uptime: 32000000000,
    });
  });
});

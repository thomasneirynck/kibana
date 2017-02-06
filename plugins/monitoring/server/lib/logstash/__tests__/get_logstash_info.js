import expect from 'expect.js';
import moment from 'moment';
import { handleResponse } from '../get_logstash_info';

describe('get_logstash_info', () => {
  it('return undefined for empty response', () => {
    const result = handleResponse({});
    expect(result).to.be(undefined);
  });

  it('return mapped data for result with hits, availability = true', () => {
    const result = handleResponse({
      _source: {
        logstash: {
          timestamp: moment().format(),
          logstash: {
            host: 'myhost'
          },
          events: {
            in: 300,
            filtered: 300,
            out: 300
          },
          reloads: {
            successes: 5,
            failures: 2
          },
          queue: {
            type: "persisted",
            events: 100
          }
        }
      }
    });
    expect(result).to.be.eql({
      host: 'myhost',
      availability: true,
      events: {
        filtered: 300,
        in: 300,
        out: 300,
      },
      reloads: {
        successes: 5,
        failures: 2
      },
      queue_type: "persisted"
    });
  });

  it('return mapped data for result with hits, availability = false', () => {
    const result = handleResponse({
      _source: {
        logstash: {
          timestamp: moment().subtract(11, 'minutes').format(),
          logstash: {
            host: 'myhost'
          },
          events: {
            in: 300,
            filtered: 300,
            out: 300
          },
          reloads: {
            successes: 5,
            failures: 2
          },
          queue: {
            type: "persisted",
            events: 100
          }
        }
      }
    });
    expect(result).to.be.eql({
      host: 'myhost',
      availability: false,
      events: {
        filtered: 300,
        in: 300,
        out: 300,
      },
      reloads: {
        successes: 5,
        failures: 2
      },
      queue_type: "persisted"
    });
  });
});

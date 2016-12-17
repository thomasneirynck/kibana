import expect from 'expect.js';
import moment from 'moment';
import { handleResponse } from '../get_kibana_info';

describe('get_kibana_info', () => {
  it('return undefined for empty response', () => {
    const result = handleResponse({});
    expect(result).to.be(undefined);
  });

  it('return mapped data for result with hits, availability = true', () => {
    const result = handleResponse({
      _source: {
        kibana: {
          timestamp: moment().format(),
          kibana: {
            data: 123
          },
          os: {
            memory: {
              free_in_bytes: 123000
            }
          }
        }
      }
    });
    expect(result).to.be.eql({
      availability: true,
      data: 123,
      os_memory_free: 123000
    });
  });

  it('return mapped data for result with hits, availability = false', () => {
    const result = handleResponse({
      _source: {
        kibana: {
          timestamp: moment().subtract(11, 'minutes').format(),
          kibana: {
            data: 123
          },
          os: {
            memory: {
              free_in_bytes: 123000
            }
          }
        }
      }
    });
    expect(result).to.be.eql({
      availability: false,
      data: 123,
      os_memory_free: 123000
    });
  });
});

import expect from 'expect.js';
import { handleResponse } from '../get_index_summary';

describe('get_index_summary', () => {
  it('default result for empty response', () => {
    const result = handleResponse({});
    expect(result).to.be.eql({
      documents: 0,
      dataSize: 0
    });
  });

  it('mapped result for response with index_stats hits', () => {
    const result = handleResponse({
      hits: {
        hits: [
          {
            _source: {
              index_stats: {
                total: {
                  docs: {
                    count: 250
                  },
                  store: {
                    size_in_bytes: 250000
                  }
                }
              }
            }
          }
        ]
      }
    });

    expect(result).to.be.eql({
      documents: 250,
      dataSize: 250000
    });
  });
});

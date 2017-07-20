import expect from 'expect.js';
import { handleResponse } from '../get_index_summary';

describe('get_index_summary', () => {
  it('default result for empty response', () => {
    const result = handleResponse({});
    expect(result).to.be.eql({
      documents: 0,
      dataSize: {
        primaries: 0,
        total: 0
      }
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
                  store: {
                    size_in_bytes: 250000
                  }
                },
                primaries: {
                  docs: {
                    count: 250
                  },
                  store: {
                    size_in_bytes: 122500
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
      dataSize: {
        primaries: 122500,
        total: 250000
      }
    });
  });
});

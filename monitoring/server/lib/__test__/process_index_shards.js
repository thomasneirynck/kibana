import expect from 'expect.js';
import { getDefaultDataObject, processIndexShards } from '../process_index_shards';

function getBucket() {
  return {
    key: '.kibana',
    doc_count: 2,
    states: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: 'STARTED',
          doc_count: 1,
          primary: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: 1, key_as_string: 'true', doc_count: 1 }]
          }
        },
        {
          key: 'UNASSIGNED',
          doc_count: 1,
          primary: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: 0, key_as_string: 'false', doc_count: 1 }]
          }
        }
      ]
    }
  };
}

describe('Processing Indexes on Shard Data', () => {
  it('Calculates the Index Shard data for a result bucket', () => {
    const data = getDefaultDataObject();
    const resultFn = processIndexShards(data);
    resultFn(getBucket());

    expect(data.totals.primary).to.be.eql(1);
    expect(data.totals.replica).to.be.eql(0);
    expect(data.totals.unassigned.primary).to.be.eql(0);
    expect(data.totals.unassigned.replica).to.be.eql(1);
    expect(data['.kibana'].status).to.be.eql('yellow');
    expect(data['.kibana'].primary).to.be.eql(1);
    expect(data['.kibana'].replica).to.be.eql(0);
    expect(data['.kibana'].unassigned.primary).to.be.eql(0);
    expect(data['.kibana'].unassigned.replica).to.be.eql(1);
  });
});

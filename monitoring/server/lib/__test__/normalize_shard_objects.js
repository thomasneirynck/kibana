import expect from 'expect.js';
import { getDefaultDataObject, normalizeIndexShards, normalizeNodeShards } from '../normalize_shard_objects';

function getIndexShardBucket() {
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

function getNodeShardBucket() {
  return {
    key: '127.0.0.1:9301',
    doc_count: 3,
    node_transport_address: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: '127.0.0.1:9301',
          doc_count: 3,
          max_timestamp: {
            value: 1457561181492,
            value_as_string: '2016-03-09T22:06:21.492Z'
          }
        }
      ]
    },
    node_names: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: 'Spider-Woman',
          doc_count: 3,
          max_timestamp: {
            value: 1457561181492,
            value_as_string: '2016-03-09T22:06:21.492Z'
          }
        }
      ]
    },
    node_data_attributes: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: []
    },
    node_master_attributes: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: []
    },
    node_ids: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: 'TqvymHFlQUWIxPGIsIBkTA',
          doc_count: 3
        }
      ]
    },
    index_count: {
      value: 3
    }
  };
}

describe('Normalizing Shard Data', () => {
  context('Index Shards', () => {
    it('Calculates the Index Shard data for a result bucket', () => {
      const data = getDefaultDataObject();
      const resultFn = normalizeIndexShards(data);
      resultFn(getIndexShardBucket());

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

  context('Node Shards', () => {
    it('Calculates the Node Shard data for a result bucket', () => {
      const data = getDefaultDataObject();
      const resultFn = normalizeNodeShards(data, 'transport_address');
      resultFn(getNodeShardBucket());

      expect(data.nodes).to.be.an('object');
      expect(data.nodes).to.only.have.key('127.0.0.1:9301');
    });
  });
});

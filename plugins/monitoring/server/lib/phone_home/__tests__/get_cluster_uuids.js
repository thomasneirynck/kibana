import expect from 'expect.js';
import sinon from 'sinon';
import { getClusterUuids, fetchClusterUuids, handleClusterUuidsResponse } from '../get_cluster_uuids';

describe('get_cluster_uuids', () => {
  const callWithRequest = sinon.stub();
  const size = 123;
  const req = {
    server: {
      config: sinon.stub().returns({
        get: sinon.stub().withArgs('xpack.monitoring.elasticsearch.index_pattern').returns('.monitoring-es-N-*')
                         .withArgs('xpack.monitoring.max_bucket_size').returns(size)
      }),
      plugins: {
        elasticsearch: {
          getCluster: sinon.stub().withArgs('monitoring').returns({ callWithRequest })
        }
      }
    }
  };
  const response = {
    aggregations: {
      cluster_uuids: {
        buckets: [
          { key: 'abc' },
          { key: 'xyz' },
          { key: '123' }
        ]
      }
    }
  };
  const expectedUuids = response.aggregations.cluster_uuids.buckets.map(bucket => bucket.key);
  const indices = ['.monitoring-es-N-today'];
  const start = new Date();
  const end = new Date();

  describe('getClusterUuids', () => {
    it('returns cluster UUIDs', async () => {
      callWithRequest.withArgs(req, 'count').returns({ hits: { total: 5 } })
                     .withArgs(req, 'count').returns({ hits: { total: 3456 } })
                     .withArgs(req, 'fieldStats').returns({ indices })
                     .withArgs(req, 'search').returns(response);

      expect(await getClusterUuids(req, start, end)).to.eql(expectedUuids);
    });
  });

  describe('fetchClusterUuids', () => {
    it('does not search if indices is empty', async () => {
      expect(fetchClusterUuids(req, [], start, end, size)).to.eql({});
    });

    it('searches for clusters', () => {
      callWithRequest.returns(response);

      expect(fetchClusterUuids(req, indices, start, end, size)).to.be(response);
    });
  });

  describe('handleClusterUuidsResponse', () => {
    // filterPath makes it easy to ignore anything unexpected because it will come back empty
    it('handles unexpected response', () => {
      const clusterUuids = handleClusterUuidsResponse({});

      expect(clusterUuids.length).to.be(0);
    });

    it('handles valid response', () => {
      const clusterUuids = handleClusterUuidsResponse(response);

      expect(clusterUuids).to.eql(expectedUuids);
    });

    it('handles no buckets response', () => {
      const clusterUuids = handleClusterUuidsResponse({
        aggregations: {
          cluster_uuids: {
            buckets: []
          }
        }
      });

      expect(clusterUuids.length).to.be(0);
    });
  });
});

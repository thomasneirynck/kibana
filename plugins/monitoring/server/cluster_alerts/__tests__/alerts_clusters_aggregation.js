import expect from 'expect.js';
import sinon from 'sinon';
import { createStubs } from './fixtures/create_stubs';
import { alertsClustersAggregation } from '../alerts_clusters_aggregation';

const clusters = [
  { cluster_uuid: 'cluster-abc0' },
  { cluster_uuid: 'cluster-abc1' },
  { cluster_uuid: 'cluster-abc2' },
  { cluster_uuid: 'cluster-abc3' }
];
const mockQueryResult = {
  aggregations: {
    group_by_cluster: {
      buckets: [
        {
          key: 'cluster-abc1',
          doc_count: 1,
          group_by_severity: {
            buckets: [ { key: 'low', doc_count: 1 } ]
          }
        },
        {
          key: 'cluster-abc2',
          doc_count: 2,
          group_by_severity: {
            buckets: [ { key: 'medium', doc_count: 2 } ]
          }
        },
        {
          key: 'cluster-abc3',
          doc_count: 3,
          group_by_severity: {
            buckets: [ { key: 'high', doc_count: 3 } ]
          }
        }
      ]
    }
  }
};

describe('Alerts Clusters Aggregation', () => {
  describe('with alerts enabled', () => {
    const featureStub = sinon.stub().returns({
      getLicenseCheckResults: () => ({ clusterAlerts: { enabled: true } })
    });
    const checkLicense = () => ({ clusterAlerts: { enabled: true } });

    it('aggregates alert count summary by cluster', () => {
      const { mockReq } = createStubs(mockQueryResult, featureStub);
      return alertsClustersAggregation(mockReq, clusters, checkLicense)
      .then(result => {
        expect(result).to.eql(
          {
            'cluster-abc0': undefined,
            'cluster-abc1': {
              count: 1,
              high: 0,
              low: 1,
              medium: 0
            },
            'cluster-abc2': {
              count: 2,
              high: 0,
              low: 0,
              medium: 2
            },
            'cluster-abc3': {
              count: 3,
              high: 3,
              low: 0,
              medium: 0
            }
          }
        );
      });
    });
  });

  describe('with alerts disabled due to license', () => {
    it('returns the input set if disabled because monitoring cluster checks', () => {
      const featureStub = sinon.stub().returns({
        getLicenseCheckResults: () => ({ clusterAlerts: { enabled: false } })
      });
      const checkLicense = () => ({ clusterAlerts: { enabled: true } });
      const { mockReq } = createStubs(mockQueryResult, featureStub);
      return alertsClustersAggregation(mockReq, clusters, checkLicense)
      .then(result => {
        expect(result).to.eql([
          { cluster_uuid: 'cluster-abc0' },
          { cluster_uuid: 'cluster-abc1' },
          { cluster_uuid: 'cluster-abc2' },
          { cluster_uuid: 'cluster-abc3' }
        ]);
      });
    });

    it('returns the input set if disabled because production cluster checks', () => {
      const featureStub = sinon.stub().returns({
        getLicenseCheckResults: () => ({ clusterAlerts: { enabled: true } })
      });
      const checkLicense = () => ({ clusterAlerts: { enabled: false } });
      const { mockReq } = createStubs(mockQueryResult, featureStub);
      return alertsClustersAggregation(mockReq, clusters, checkLicense)
      .then(result => {
        // TODO: prefer to have the result in the previous test align with this same data format
        expect(result).to.eql({
          'cluster-abc0': undefined,
          'cluster-abc1': undefined,
          'cluster-abc2': undefined,
          'cluster-abc3': undefined
        });
      });
    });
  });
});


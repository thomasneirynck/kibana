import expect from 'expect.js';
import sinon from 'sinon';
import { findClustersForClusterAlerts, handleFindClustersForClusterAlertsResponse, } from '../index_management';

describe('.monitoring-alerts-N index management', () => {
  const server = {
    config: sinon.stub().returns({
      get: sinon.stub().withArgs('xpack.monitoring.cluster_alerts.index').returns('.monitoring-alerts-N')
                       .withArgs('xpack.monitoring.loggingTag').returns('monitoring-ui')
                       .withArgs('xpack.monitoring.max_bucket_size').returns(1000)
    }),
    log: sinon.stub()
  };

  const types = ['basic', 'trial', 'standard', 'gold', 'platinum'];
  const statuses = ['active', 'expired'];
  const ignoredType = types[0];
  const acceptedStatus = statuses[0];

  // seed it with some very broken docs
  const clusters = [
    { _source: { license: { type: types[1], status: acceptedStatus } } },
    { _id: 'no-source' },
    { _id: 'no_license', _source: {} },
    { _id: 'no_status', _source: { license: { type: types[2] } } },
    { _id: 'no_type', _source: { license: { status: acceptedStatus } } }
  ];

  const supportedClusterUuids = [];
  const unsupportedClusterUuids = clusters.map(cluster => cluster._id).filter(Boolean);

  expect(unsupportedClusterUuids).to.have.length(4);

  // create a cluster with each license status / type
  for (const type of types) {
    for (const status of statuses) {
      const clusterUuid = type + '-' + status;

      clusters.push({ _id: clusterUuid, _source: { license: { type, status } } });

      if (type !== ignoredType && status === acceptedStatus) {
        supportedClusterUuids.push(clusterUuid);
      } else {
        unsupportedClusterUuids.push(clusterUuid);
      }
    }
  }

  const filteredResponse = {
    hits: {
      total: clusters.length,
      hits: clusters
    }
  };

  function expectEquivalentArrays(actual, expected) {
    expect(actual).to.have.length(expected.length);

    for (const value of expected) {
      expect(actual).to.contain(value);
    }
  }

  it('no hits returns empty cluster uuids list', () => {
    expect(handleFindClustersForClusterAlertsResponse({}, { supportsAlerts: true })).to.be.empty();
    expect(handleFindClustersForClusterAlertsResponse({ hits: { total: 0 } }, { supportsAlerts: true })).to.be.empty();
  });

  it('only return monitored clusters with an acceptable license', () => {
    const clusterUuids = handleFindClustersForClusterAlertsResponse(filteredResponse, { supportsAlerts: true });

    expectEquivalentArrays(clusterUuids, supportedClusterUuids);
  });

  it('only return monitored clusters with an unsupported license', () => {
    const clusterUuids = handleFindClustersForClusterAlertsResponse(filteredResponse, { supportsAlerts: false });

    expectEquivalentArrays(clusterUuids, unsupportedClusterUuids);
  });

  it('find clusters for cluster alerts handles failure', async () => {
    const client = { search: sinon.stub().returns(Promise.reject(new Error('expected for test'))) };
    const clusterUuids = await findClustersForClusterAlerts(server, client, { supportsAlerts: true });

    expect(clusterUuids).to.be.empty();
  });

  it('find clusters filters the response properly with valid license', async () => {
    const client = { search: sinon.stub().returns(Promise.resolve(filteredResponse)) };
    const clusterUuids = await findClustersForClusterAlerts(server, client, { supportsAlerts: true });

    expectEquivalentArrays(clusterUuids, handleFindClustersForClusterAlertsResponse(filteredResponse, { supportsAlerts: true }));

    expect(client.search.calledOnce).to.be(true);
  });

  it('find clusters filters the response properly with invalid license', async () => {
    const client = { search: sinon.stub().returns(Promise.resolve(filteredResponse)) };
    const clusterUuids = await findClustersForClusterAlerts(server, client, { supportsAlerts: false });

    expectEquivalentArrays(clusterUuids, handleFindClustersForClusterAlertsResponse(filteredResponse, { supportsAlerts: false }));

    expect(client.search.calledOnce).to.be(true);
  });
});

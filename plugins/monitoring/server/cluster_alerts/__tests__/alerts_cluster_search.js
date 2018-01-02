import expect from 'expect.js';
import sinon from 'sinon';
import { createStubs } from './fixtures/create_stubs';
import { alertsClusterSearch } from '../alerts_cluster_search';

const mockQueryResult = {
  hits: {
    hits: [
      {
        _source: {
          alertsClusterSearchTest: true
        }
      }
    ]
  }
};

describe('Alerts Cluster Search', () => {
  describe('License checks pass', () => {
    const featureStub = sinon.stub().returns({
      getLicenseCheckResults: () => ({ clusterAlerts: { enabled: true } })
    });
    const checkLicense = () => ({ clusterAlerts: { enabled: true } });

    it('max hit count option', () => {
      const { mockReq, callWithRequestStub } = createStubs(mockQueryResult, featureStub);
      return alertsClusterSearch(mockReq, '.monitoring-alerts', { cluster_uuid: 'cluster-1234' }, checkLicense)
        .then(alerts => {
          const result = [ { alertsClusterSearchTest: true } ];
          expect(alerts).to.eql(result);
          expect(callWithRequestStub.getCall(0).args[2].body.size).to.be.undefined;
        });
    });

    it('set hit count option', () => {
      const { mockReq, callWithRequestStub } = createStubs(mockQueryResult, featureStub);
      return alertsClusterSearch(mockReq, '.monitoring-alerts', { cluster_uuid: 'cluster-1234' }, checkLicense, { size: 3 })
        .then(alerts => {
          const result = [ { alertsClusterSearchTest: true } ];
          expect(alerts).to.eql(result);
          expect(callWithRequestStub.getCall(0).args[2].body.size).to.be(3);
        });
    });

    it('should report static info-level alert when relevent', () => {
      const { mockReq, callWithRequestStub } = createStubs(mockQueryResult, featureStub);
      const cluster = {
        cluster_uuid: 'cluster-1234',
        timestamp: 'fake-timestamp',
        version: '6.1.0-throwmeaway2',
        license: {
          cluster_needs_tls: true,
          issue_date: 'fake-issue_date'
        }
      };
      return alertsClusterSearch(mockReq, '.monitoring-alerts', cluster, checkLicense, { size: 3 })
        .then(alerts => {
          expect(alerts).to.have.length(2);
          expect(alerts[0]).to.eql({ alertsClusterSearchTest: true });
          expect(alerts[1]).to.eql({
            metadata: {
              severity: 0,
              cluster_uuid: cluster.cluster_uuid,
              link: 'https://www.elastic.co/guide/en/x-pack/6.1/ssl-tls.html'
            },
            update_timestamp: cluster.timestamp,
            timestamp: cluster.license.issue_date,
            prefix: 'Configuring TLS will be required to apply a Gold or Platinum license when security is enabled.',
            message: 'See documentation for details.'
          });
          expect(callWithRequestStub.getCall(0).args[2].body.size).to.be(3);
        });
    });
  });

  describe('License checks fail', () => {
    it('monitoring cluster license checks fail', () => {
      const featureStub = sinon.stub().returns({
        getLicenseCheckResults: () => ({ message: 'monitoring cluster license check fail', clusterAlerts: { enabled: false } })
      });
      const checkLicense = sinon.stub();
      const { mockReq, callWithRequestStub } = createStubs({}, featureStub);
      return alertsClusterSearch(mockReq, '.monitoring-alerts', { cluster_uuid: 'cluster-1234' }, checkLicense)
        .then(alerts => {
          const result = { message: 'monitoring cluster license check fail' };
          expect(alerts).to.eql(result);
          expect(checkLicense.called).to.be(false);
          expect(callWithRequestStub.called).to.be(false);
        });
    });

    it('production cluster license checks fail', () => {
      // monitoring cluster passes
      const featureStub = sinon.stub().returns({
        getLicenseCheckResults: () => ({ clusterAlerts: { enabled: true } })
      });
      const checkLicense = sinon.stub().returns({ clusterAlerts: { enabled: false }, message: 'prod goes boom' });
      const { mockReq, callWithRequestStub } = createStubs({}, featureStub);
      return alertsClusterSearch(mockReq, '.monitoring-alerts', { cluster_uuid: 'cluster-1234' }, checkLicense)
        .then(alerts => {
          const result = { message: 'prod goes boom' };
          expect(alerts).to.eql(result);
          expect(checkLicense.calledOnce).to.be(true);
          expect(callWithRequestStub.called).to.be(false);
        });
    });
  });
});

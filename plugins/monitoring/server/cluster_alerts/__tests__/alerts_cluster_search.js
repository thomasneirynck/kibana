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
      return alertsClusterSearch(mockReq, { cluster_uuid: 'cluster-1234' }, checkLicense)
      .then(alerts => {
        const result = [ { alertsClusterSearchTest: true } ];
        expect(alerts).to.eql(result);
        expect(callWithRequestStub.getCall(0).args[2].body.size).to.be.undefined;
      });
    });

    it('set hit count option', () => {
      const { mockReq, callWithRequestStub } = createStubs(mockQueryResult, featureStub);
      return alertsClusterSearch(mockReq, { cluster_uuid: 'cluster-1234' }, checkLicense, { size: 3 })
      .then(alerts => {
        const result = [ { alertsClusterSearchTest: true } ];
        expect(alerts).to.eql(result);
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
      return alertsClusterSearch(mockReq, { cluster_uuid: 'cluster-1234' }, checkLicense)
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
      return alertsClusterSearch(mockReq, { cluster_uuid: 'cluster-1234' }, checkLicense)
      .then(alerts => {
        const result = { message: 'prod goes boom' };
        expect(alerts).to.eql(result);
        expect(checkLicense.calledOnce).to.be(true);
        expect(callWithRequestStub.called).to.be(false);
      });
    });
  });
});

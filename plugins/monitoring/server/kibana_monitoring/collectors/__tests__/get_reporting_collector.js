import expect from 'expect.js';
import sinon from 'sinon';
import { getReportingCollector } from '../get_reporting_collector';

describe('getReportingCollector', () => {
  let clusterStub;
  let configStub;
  let serverStub;

  beforeEach(() => {
    clusterStub = { callWithRequest: sinon.stub().returns(Promise.resolve({})) };
    configStub = { get: sinon.stub() };
    serverStub = {
      plugins: {
        elasticsearch: { getCluster: sinon.stub() },
        xpack_main: {
          info: {
            license: { getType: sinon.stub() },
            isAvailable() { return true; }
          }
        }
      },
      config: () => ({
        get: sinon.stub().withArgs('xpack.reporting.enabled').returns(true)
      }),
      expose: sinon.stub(),
      log: sinon.stub(),
    };

    serverStub.plugins.elasticsearch.getCluster.withArgs('admin').returns(clusterStub);
  });

  it('correctly defines reporting collector.', () => {
    const reportingCollector = getReportingCollector(serverStub, configStub);

    expect(reportingCollector.type).to.be('reporting_stats');
    expect(reportingCollector.fetch).to.be.a(Function);
  });

  describe('credentials', () => {
    it('complements request with `Authorization` header if internal user credentials are defined.', async () => {
      configStub.get.withArgs('elasticsearch.username').returns('user');
      configStub.get.withArgs('elasticsearch.password').returns('password');

      const reportingCollector = getReportingCollector(serverStub, configStub);
      await reportingCollector.fetch();

      sinon.assert.calledOnce(clusterStub.callWithRequest);
      const [ firstArg, secondArg ] = clusterStub.callWithRequest.getCall(0).args;
      expect(firstArg).to.eql({ headers: { authorization: 'Basic dXNlcjpwYXNzd29yZA==' } });
      expect(secondArg).to.be('search');
    });

    it('does not complement request with `Authorization` header if internal user username is not defined.', async () => {
      configStub.get.withArgs('elasticsearch.password').returns('password');

      const reportingCollector = getReportingCollector(serverStub, configStub);
      await reportingCollector.fetch();

      sinon.assert.calledOnce(clusterStub.callWithRequest);
      const [ firstArg, secondArg ] = clusterStub.callWithRequest.getCall(0).args;
      expect(firstArg).to.eql({ headers: {} });
      expect(secondArg).to.be('search');
    });

    it('does not complement request with `Authorization` header if internal user password is not defined.', async () => {
      configStub.get.withArgs('elasticsearch.username').returns('user');

      const reportingCollector = getReportingCollector(serverStub, configStub);
      await reportingCollector.fetch();

      sinon.assert.calledOnce(clusterStub.callWithRequest);
      const [ firstArg, secondArg ] = clusterStub.callWithRequest.getCall(0).args;
      expect(firstArg).to.eql({ headers: {} });
      expect(secondArg).to.be('search');
    });
  });
});

import expect from 'expect.js';
import sinon from 'sinon';
import { getReportingCollector } from '../get_reporting_collector';
import { callClusterFactory } from '../../../../../xpack_main';

describe('getReportingCollector', () => {
  let clusterStub;
  let serverStub;
  let callClusterStub;

  beforeEach(() => {
    clusterStub = { callWithInternalUser: sinon.stub().returns(Promise.resolve({})) };
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
      config: () => ({ get: sinon.stub() }),
      expose: sinon.stub(),
      log: sinon.stub(),
    };

    serverStub.plugins.elasticsearch.getCluster.withArgs('admin').returns(clusterStub);
    callClusterStub = callClusterFactory(serverStub).getCallClusterInternal();
  });

  it('correctly defines reporting collector.', () => {
    const reportingCollector = getReportingCollector(serverStub, callClusterStub);

    expect(reportingCollector.type).to.be('reporting_stats');
    expect(reportingCollector.fetch).to.be.a(Function);
  });

  it('calls callWithInternalUser with the `search` method', async () => {
    const reportingCollector = getReportingCollector(serverStub, callClusterStub);
    await reportingCollector.fetch();

    sinon.assert.calledOnce(clusterStub.callWithInternalUser);
    const [ method ] = clusterStub.callWithInternalUser.getCall(0).args;
    expect(method).to.be('search');
  });
});

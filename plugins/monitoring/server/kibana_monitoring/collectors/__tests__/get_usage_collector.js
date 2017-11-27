import expect from 'expect.js';
import sinon from 'sinon';
import { getUsageCollector } from '../get_usage_collector';
import { callClusterFactory } from '../../../../../xpack_main';

describe('getUsageCollector', () => {
  let clusterStub;
  let serverStub;
  let callClusterStub;

  beforeEach(() => {
    clusterStub = { callWithInternalUser: sinon.stub().returns(Promise.resolve({})) };
    serverStub = {
      plugins: {
        elasticsearch: {
          getCluster: sinon.stub()
        }
      },
      getKibanaStats: sinon.stub(),
      config: () => ({ get: sinon.stub() })
    };
    serverStub.plugins.elasticsearch.getCluster.withArgs('admin').returns(clusterStub);
    serverStub.getKibanaStats.returns({ index: 'foo' });
    callClusterStub = callClusterFactory(serverStub).getCallClusterInternal();
  });

  it('correctly defines usage collector.', () => {
    const usageCollector = getUsageCollector(serverStub, callClusterStub);

    expect(usageCollector.type).to.be('kibana');
    expect(usageCollector.fetch).to.be.a(Function);
  });

  it('calls callWithInternalUser with the `search` method', async () => {
    const usageCollector = getUsageCollector(serverStub, callClusterStub);
    await usageCollector.fetch();

    sinon.assert.calledOnce(serverStub.getKibanaStats);
    sinon.assert.calledWithExactly(serverStub.getKibanaStats, sinon.match({ callCluster: callClusterStub }));

    sinon.assert.calledOnce(clusterStub.callWithInternalUser);
    const [ method ] = clusterStub.callWithInternalUser.getCall(0).args;
    expect(method).to.be('search');
  });
});

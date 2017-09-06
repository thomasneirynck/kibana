import expect from 'expect.js';
import sinon from 'sinon';

import { BasicCredentials } from '../../../../security/server/lib/authentication/providers/basic';
import { getUsageCollector } from '../get_usage_collector';

describe('getUsageCollector', () => {
  let clusterStub;
  let configStub;
  let serverStub;

  beforeEach(() => {
    clusterStub = { callWithRequest: sinon.stub() };
    configStub = { get: sinon.stub() };
    serverStub = {
      plugins: {
        elasticsearch: {
          getCluster: sinon.stub()
        }
      },
      getKibanaStats: sinon.stub()
    };

    serverStub.plugins.elasticsearch.getCluster.withArgs('admin').returns(clusterStub);
  });

  it('correctly defines usage collector.', () => {
    const usageCollector = getUsageCollector(serverStub, configStub);

    expect(usageCollector.type).to.be('kibana');
    expect(usageCollector.fetch).to.be.a(Function);
  });

  it('complements request with `Authorization` header if internal user credentials are defined.', () => {
    configStub.get.withArgs('elasticsearch.username').returns('user');
    configStub.get.withArgs('elasticsearch.password').returns('password');

    const usageCollector = getUsageCollector(serverStub, configStub);
    usageCollector.fetch();

    sinon.assert.calledOnce(serverStub.getKibanaStats);
    sinon.assert.calledWithExactly(serverStub.getKibanaStats, sinon.match({ callCluster: sinon.match.func }));

    const callCluster = serverStub.getKibanaStats.firstCall.args[0].callCluster;
    callCluster('arg-one', 'arg-two');

    sinon.assert.calledOnce(clusterStub.callWithRequest);
    sinon.assert.calledWithExactly(
      clusterStub.callWithRequest,
      BasicCredentials.decorateRequest({ headers: {} }, 'user', 'password'),
      'arg-one',
      'arg-two'
    );
  });

  it('does not complement request with `Authorization` header if internal user username is not defined.', () => {
    configStub.get.withArgs('elasticsearch.password').returns('password');

    const usageCollector = getUsageCollector(serverStub, configStub);
    usageCollector.fetch();

    sinon.assert.calledOnce(serverStub.getKibanaStats);
    sinon.assert.calledWithExactly(serverStub.getKibanaStats, sinon.match({ callCluster: sinon.match.func }));

    const callCluster = serverStub.getKibanaStats.firstCall.args[0].callCluster;
    callCluster('arg-one', 'arg-two');

    sinon.assert.calledOnce(clusterStub.callWithRequest);
    sinon.assert.calledWithExactly(
      clusterStub.callWithRequest,
      { headers: { } },
      'arg-one',
      'arg-two'
    );
  });

  it('does not complement request with `Authorization` header if internal user password is not defined.', () => {
    configStub.get.withArgs('elasticsearch.username').returns('user');

    const usageCollector = getUsageCollector(serverStub, configStub);
    usageCollector.fetch();

    sinon.assert.calledOnce(serverStub.getKibanaStats);
    sinon.assert.calledWithExactly(serverStub.getKibanaStats, sinon.match({ callCluster: sinon.match.func }));

    const callCluster = serverStub.getKibanaStats.firstCall.args[0].callCluster;
    callCluster('arg-one', 'arg-two');

    sinon.assert.calledOnce(clusterStub.callWithRequest);
    sinon.assert.calledWithExactly(
      clusterStub.callWithRequest,
      { headers: { } },
      'arg-one',
      'arg-two'
    );
  });
});

import expect from 'expect.js';
import sinon from 'sinon';
import setElasticsearchAuth from '../../../server/lib/set_elasticsearch_auth';

describe('setElasticsearchAuth', function () {
  const config = {
    get: sinon.stub(),
    set: sinon.stub()
  };

  beforeEach(() => {
    config.get.reset();
    config.set.reset();
  });

  it('should return a function', function () {
    expect(setElasticsearchAuth).to.be.a('function');
  });

  it('should use kibana/changeme when nothing is set', function () {
    config.get.withArgs('elasticsearch').returns({});
    config.get.withArgs('xpack.security.kibana.password').returns(undefined);
    setElasticsearchAuth(config);

    sinon.assert.calledWith(config.set, 'elasticsearch.username', 'kibana');
    sinon.assert.calledWith(config.set, 'elasticsearch.password', 'changeme');
  });

  it('should use kibana/changeme when elasticsearch.username/password are not both set', function () {
    config.get.withArgs('elasticsearch').returns({username: 'foo'});
    config.get.withArgs('xpack.security.kibana.password').returns(undefined);
    setElasticsearchAuth(config);

    sinon.assert.calledWith(config.set, 'elasticsearch.username', 'kibana');
    sinon.assert.calledWith(config.set, 'elasticsearch.password', 'changeme');
  });

  it('should use xpack.security.kibana.password if set', function () {
    const password = 'password';
    config.get.withArgs('elasticsearch').returns({});
    config.get.withArgs('xpack.security.kibana.password').returns(password);
    setElasticsearchAuth(config);

    sinon.assert.calledWith(config.set, 'elasticsearch.username', 'kibana');
    sinon.assert.calledWith(config.set, 'elasticsearch.password', password);
  });

  it('should not override elasticsearch.username/password if set and xpack.security.kibana.password is not set', function () {
    const auth = {
      username: 'foo',
      password: 'bar'
    };
    config.get.withArgs('elasticsearch').returns(auth);
    config.get.withArgs('xpack.security.kibana.password').returns(undefined);
    setElasticsearchAuth(config);

    sinon.assert.notCalled(config.set);
  });

  it('should override elasticsearch.username/password if xpack.security.kibana.password is set', function () {
    const auth = {
      username: 'foo',
      password: 'bar'
    };
    const password = 'password';
    config.get.withArgs('elasticsearch').returns(auth);
    config.get.withArgs('xpack.security.kibana.password').returns(password);
    setElasticsearchAuth(config);

    sinon.assert.calledWith(config.set, 'elasticsearch.username', 'kibana');
    sinon.assert.calledWith(config.set, 'elasticsearch.password', password);
  });
});

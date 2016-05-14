import expect from 'expect.js';
import sinon from 'sinon';
import {USERNAME, PASSWORD} from '../../../server/lib/default_auth';
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
    setElasticsearchAuth(config);

    sinon.assert.calledWith(config.set, 'elasticsearch.username', USERNAME);
    sinon.assert.calledWith(config.set, 'elasticsearch.password', PASSWORD);
  });

  it('should use kibana/elasticsearch.password if set', function () {
    const password = 'password';
    config.get.withArgs('elasticsearch').returns({password});
    setElasticsearchAuth(config);

    sinon.assert.calledWith(config.set, 'elasticsearch.username', USERNAME);
  });

  it('should not override elasticsearch.username/password if set', function () {
    const auth = {
      username: 'foo',
      password: 'bar'
    };
    config.get.withArgs('elasticsearch').returns(auth);
    setElasticsearchAuth(config);

    sinon.assert.notCalled(config.set);
  });
});

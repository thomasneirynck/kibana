const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');
const fixtures = require('requirefrom')('test/fixtures');
const mockClient = fixtures('mock_elasticsearch_client');
const lib = require('requirefrom')('server/lib');
const createClient = lib('create_client');

describe('create_client', function () {
  let elasticsearch;
  let config;

  beforeEach(function () {
    elasticsearch = {
      createClient: sinon.stub().returns(mockClient)
    };

    config = {
      get: sinon.spy()
    };
  });

  it('should read config data', function () {
    createClient(elasticsearch, config);

    expect(config.get.callCount).to.equal(2);
    expect(config.get.withArgs('reporting.auth.username').calledOnce).to.be.true;
    expect(config.get.withArgs('reporting.auth.password').calledOnce).to.be.true;
  });

  it('should not use auth by default', function () {
    createClient(elasticsearch, config);

    expect(elasticsearch.createClient.callCount).to.equal(1);
    expect(elasticsearch.createClient.firstCall.args[0]).to.have.property('auth', false);
  });

  it('should use auth if provided', function () {
    // change how config works
    const stub = sinon.stub();
    config = {
      get: stub
    };
    stub.withArgs('reporting.auth.username').returns('user1');
    stub.withArgs('reporting.auth.password').returns('mypass');

    createClient(elasticsearch, config);

    expect(elasticsearch.createClient.callCount).to.equal(1);
    expect(elasticsearch.createClient.firstCall.args[0]).to.have.property('username', 'user1');
    expect(elasticsearch.createClient.firstCall.args[0]).to.have.property('password', 'mypass');
  });

  describe('custom methods', function () {
    describe('authenticated', function () {
      it('should contain method', function () {
        const client = createClient(elasticsearch, config);
        expect(client).to.respondTo('authenticated');
      });

      it('should call client.info', function () {
        const client = createClient(elasticsearch, config);
        const spy = sinon.spy(client, 'info');

        return client.authenticated().then(function () {
          spy.restore();
          expect(spy.callCount).to.equal(1);
        });
      });

      it('should be true if resolved', function () {
        const client = createClient(elasticsearch, config);

        return client.authenticated().then(function (authed) {
          expect(authed).to.be.true;
        });
      });

      it('should be false if rejected', function () {
        const client = createClient(elasticsearch, config);
        const stub = sinon.stub(client, 'info').returns(Promise.reject());

        return client.authenticated().then(function (authed) {
          stub.restore();
          expect(authed).to.be.false;
        });
      });
    });
  });
});
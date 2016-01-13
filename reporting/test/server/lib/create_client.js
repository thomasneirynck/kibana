const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');
const fixtures = require('requirefrom')('test/fixtures');
const mockClient = fixtures('mock_elasticsearch_client');
const lib = require('requirefrom')('server/lib');
const createClient = lib('create_client');

describe('create_client', function () {
  let elasticsearch;

  beforeEach(function () {
    elasticsearch = {
      createClient: sinon.stub().returns(mockClient)
    };
  });

  it('should not use auth by default', function () {
    createClient(elasticsearch);

    expect(elasticsearch.createClient.callCount).to.equal(1);
    expect(elasticsearch.createClient.firstCall.args[0]).to.have.property('auth', false);
  });

  it('should use auth if provided', function () {
    createClient(elasticsearch, {
      username: 'user1',
      password: 'mypass',
    });

    expect(elasticsearch.createClient.callCount).to.equal(1);
    expect(elasticsearch.createClient.firstCall.args[0]).to.not.have.property('auth');
    expect(elasticsearch.createClient.firstCall.args[0]).to.have.property('username', 'user1');
    expect(elasticsearch.createClient.firstCall.args[0]).to.have.property('password', 'mypass');
  });

  describe('custom methods', function () {
    describe('checkConnection', function () {
      it('should contain method', function () {
        const client = createClient(elasticsearch);
        expect(client).to.respondTo('checkConnection');
      });

      it('should call client.info', function () {
        const client = createClient(elasticsearch);
        const spy = sinon.spy(client, 'info');

        return client.checkConnection().then(function () {
          spy.restore();
          expect(spy.callCount).to.equal(1);
        });
      });

      it('should be true if resolved', function () {
        const client = createClient(elasticsearch);

        return client.checkConnection();
      });

      it('should be false if rejected', function () {
        const client = createClient(elasticsearch);
        const stub = sinon.stub(client, 'info').returns(Promise.reject());

        return client.checkConnection().catch(function (err) {
          stub.restore();
          expect(err).to.match(/Can not communicate with Elasticsearch/i);
        });
      });
    });
  });
});
var expect = require('chai').expect;
var sinon = require('sinon');
var lib = require('requirefrom')('server/lib');
var createClient = lib('create_client');

describe('create_client', function () {
  let elasticsearch;
  let config;

  beforeEach(function () {
    elasticsearch = {
      createClient: sinon.spy()
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
    var stub = sinon.stub();
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
});
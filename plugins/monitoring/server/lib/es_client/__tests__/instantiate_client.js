import expect from 'expect.js';
import sinon from 'sinon';
import { identity, noop } from 'lodash';
import { exposeClient } from '../instantiate_client';

function getMockElasticsearchModule() {
  return {
    Client: identity
  };
}

function getMockServerFromConnectionUrl(monitoringClusterUrl) {
  const get = sinon.stub();
  // monitoring config
  get.withArgs('xpack.monitoring.loggingTag').returns('monitoring-ui-test');
  get.withArgs('xpack.monitoring.elasticsearch').returns({
    url: monitoringClusterUrl,
    username: 'monitoring-user-internal-test',
    password: 'monitoring-p@ssw0rd!-internal-test',
    ssl: {}
  });
  get.withArgs('xpack.monitoring.elasticsearch.url').returns(monitoringClusterUrl);
  get.withArgs('xpack.monitoring.elasticsearch.customHeaders').returns({ 'x-custom-headers-test': 'connection-monitoring' });

  // production config
  const productionUrl = 'http://localhost:9200';
  get.withArgs('elasticsearch.customHeaders').returns({ 'x-custom-headers-test': 'connection-production' });
  get.withArgs('elasticsearch.url').returns(productionUrl);
  get.withArgs('elasticsearch').returns({
    url: productionUrl,
    username: 'user-internal-test',
    password: 'p@ssw0rd!-internal-test',
    ssl: {}
  });

  const config = () => {
    return {
      get,
      set: noop
    };
  };

  return {
    config,
    plugins: {
      elasticsearch: {
        callWithRequestFactory: identity,
        ElasticsearchClientLogging: noop
      }
    },
    on: noop,
    expose: sinon.stub(),
    log: sinon.stub()
  };
}

describe('Instantiate Client', () => {
  const elasticsearch = getMockElasticsearchModule();

  describe('Logging', () => {
    it('logs that the config was sourced from the production options', () => {
      const server = getMockServerFromConnectionUrl(null); // pass null for URL to create the client using prod config
      exposeClient(server, elasticsearch);

      expect(server.log.getCall(0).args).to.eql([
        [ 'monitoring-ui-test', 'es-client' ],
        'config sourced from: production cluster (localhost:9200)'
      ]);
    });

    it('logs that the config was sourced from the monitoring options', () => {
      const server = getMockServerFromConnectionUrl('http://monitoring-cluster.test:9200');
      exposeClient(server, elasticsearch);

      expect(server.log.getCall(0).args).to.eql([
        [ 'monitoring-ui-test', 'es-client' ],
        'config sourced from: monitoring cluster (monitoring-cluster.test:9200)'
      ]);
    });
  });

  describe('Custom Headers Configuration', () => {
    it('Adds xpack.monitoring.elasticsearch.customHeaders if connected to production cluster', () => {
      const server = getMockServerFromConnectionUrl(null); // pass null for URL to create the client using prod config
      exposeClient(server, elasticsearch);

      const exposeClientCall = server.expose.getCall(0);
      const exposeCallWithRequestCall = server.expose.getCall(1);
      const hostObjectClient = exposeClientCall.args[1].host;
      const hostObjectCallWithRequest = exposeCallWithRequestCall.args[1].host;

      expect(hostObjectClient.headers).to.eql({ 'x-custom-headers-test': 'connection-monitoring' });
      expect(hostObjectCallWithRequest.headers).to.eql({ 'x-custom-headers-test': 'connection-monitoring' });
    });

    it('Adds xpack.monitoring.elasticsearch.customHeaders if connected to monitoring cluster', () => {
      const server = getMockServerFromConnectionUrl('http://monitoring-cluster.test:9200');
      exposeClient(server, elasticsearch);

      const exposeClientCall = server.expose.getCall(0);
      const exposeCallWithRequestCall = server.expose.getCall(1);
      const hostObjectClient = exposeClientCall.args[1].host;
      const hostObjectCallWithRequest = exposeCallWithRequestCall.args[1].host;

      expect(hostObjectClient.headers).to.eql({ 'x-custom-headers-test': 'connection-monitoring' });
      expect(hostObjectCallWithRequest.headers).to.eql({ 'x-custom-headers-test': 'connection-monitoring' });
    });
  });

  describe('Use a connection to production cluster', () => {
    it('exposes an authenticated client using production host settings', () => {
      const server = getMockServerFromConnectionUrl(null); // pass null for URL to create the client using prod config
      exposeClient(server, elasticsearch);

      expect(server.expose.callCount).to.be(2);

      const exposeClientCall = server.expose.getCall(0);
      expect(exposeClientCall.args[0]).to.be('client');

      const hostObject = exposeClientCall.args[1].host;
      expect(hostObject.host).to.eql('localhost');
      expect(hostObject.port).to.eql('9200');
      expect(hostObject.protocol).to.eql('http:');
      expect(hostObject.path).to.eql('/');
      expect(hostObject.auth).to.eql('user-internal-test:p@ssw0rd!-internal-test');
      expect(hostObject.query).to.eql(null);
    });

    it('exposes callWithRequest for an unauthenticated client using production host settings', () => {
      const server = getMockServerFromConnectionUrl(null); // pass null for URL to create the client using prod config
      exposeClient(server, elasticsearch);

      expect(server.expose.callCount).to.be(2);

      const exposeCallWithRequestCall = server.expose.getCall(1);
      expect(exposeCallWithRequestCall.args[0]).to.be('callWithRequest');

      const hostObject = exposeCallWithRequestCall.args[1].host;
      expect(hostObject.host).to.eql('localhost');
      expect(hostObject.port).to.eql('9200');
      expect(hostObject.protocol).to.eql('http:');
      expect(hostObject.path).to.eql('/');
      expect(hostObject.auth).to.eql(null);
      expect(hostObject.query).to.eql(null);
    });
  });

  describe('Use a connection to monitoring cluster', () => {
    it('exposes an authenticated client using monitoring host settings', () => {
      const server = getMockServerFromConnectionUrl('http://monitoring-cluster.test:9200');
      exposeClient(server, elasticsearch);

      expect(server.expose.callCount).to.be(2);

      const exposeClientCall = server.expose.getCall(0);
      expect(exposeClientCall.args[0]).to.be('client');

      const hostObject = exposeClientCall.args[1].host;
      expect(hostObject.host).to.eql('monitoring-cluster.test');
      expect(hostObject.port).to.eql('9200');
      expect(hostObject.protocol).to.eql('http:');
      expect(hostObject.path).to.eql('/');
      expect(hostObject.auth).to.eql('monitoring-user-internal-test:monitoring-p@ssw0rd!-internal-test');
      expect(hostObject.query).to.eql(null);
    });

    it('exposes callWithRequest for an unauthenticated client using monitoring host settings', () => {
      const server = getMockServerFromConnectionUrl('http://monitoring-cluster.test:9200');
      exposeClient(server, elasticsearch);

      expect(server.expose.callCount).to.be(2);

      const exposeCallWithRequestCall = server.expose.getCall(1);
      expect(exposeCallWithRequestCall.args[0]).to.be('callWithRequest');

      const hostObject = exposeCallWithRequestCall.args[1].host;
      expect(hostObject.host).to.eql('monitoring-cluster.test');
      expect(hostObject.port).to.eql('9200');
      expect(hostObject.protocol).to.eql('http:');
      expect(hostObject.path).to.eql('/');
      expect(hostObject.auth).to.eql(null);
      expect(hostObject.query).to.eql(null);
    });
  });
});

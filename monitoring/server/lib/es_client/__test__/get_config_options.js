import getConfigOptions from '../get_config_options';
import expect from 'expect.js';
import sinon from 'sinon';

function getMockConfig() {
  const config = { get: sinon.stub(), set: sinon.stub() };
  config.get
  .withArgs('elasticsearch.url').returns('http://localhost:9200')
  .withArgs('elasticsearch.username').returns('produser')
  .withArgs('elasticsearch.password').returns('prodpass')
  .withArgs('elasticsearch.ssl.verify').returns(true)
  .withArgs('monitoring.elasticsearch.username').returns('monitoringuser')
  .withArgs('monitoring.elasticsearch.password').returns('monitoringpass')
  .withArgs('monitoring.elasticsearch.ssl.verify').returns(true);
  return config;
}

describe('Client Config Options', () => {
  it(`Defaults to Kibana's production cluster config settings`, () => {
    const config = getMockConfig();
    const { options, uri, ssl } = getConfigOptions(config);

    expect(options.url).to.be('http://localhost:9200');
    expect(options.configSource).to.be('production');
    expect(uri.auth).to.be('produser:prodpass');
    expect(ssl.rejectUnauthorized).to.be(true);
    expect(config.set.called).to.be(true);
  });
  it(`Uses Monitoring cluster config settings if URL is given`, () => {
    const config = getMockConfig();
    config.get.withArgs('monitoring.elasticsearch.url').returns('http://localhost:9210');
    const { options, uri, ssl } = getConfigOptions(config);

    expect(options.url).to.be('http://localhost:9210');
    expect(options.configSource).to.be('monitoring');
    expect(uri.auth).to.be('monitoringuser:monitoringpass');
    expect(ssl.rejectUnauthorized).to.be(true);
    expect(config.set.called).to.be(false);
  });
});

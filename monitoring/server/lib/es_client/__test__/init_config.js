import initConfig from '../init_config';
import expect from 'expect.js';
import sinon from 'sinon';
import { join } from 'path';

function getMockConfig() {
  const config = { get: sinon.stub(), set: sinon.stub() };
  config.get
  .withArgs('elasticsearch').returns({
    url: 'http://localhost:9200',
    username: 'produser',
    password: 'prodpass',
    ssl: {
      verify: true
    }
  });
  return config;
}

describe('Client Config Options', () => {
  it(`Defaults to Kibana's production cluster config settings`, () => {
    const config = getMockConfig();
    const { options, noAuthUri, authUri, ssl } = initConfig(config);

    expect(options.url).to.be('http://localhost:9200');
    expect(options.configSource).to.be('production');
    expect(authUri.auth).to.be('produser:prodpass');
    expect(noAuthUri.auth).to.eql(null);
    expect(ssl.rejectUnauthorized).to.be(true);
    expect(config.set.called).to.be(true);
  });
  it(`Uses Monitoring cluster config settings if URL is given`, () => {
    const config = getMockConfig();
    config.get
    .withArgs('xpack.monitoring.elasticsearch.url').returns('http://localhost:9210')
    .withArgs('xpack.monitoring.elasticsearch').returns({
      url: 'http://localhost:9210',
      username: 'monitoringuser',
      password: 'monitoringpass',
      ssl: {
        verify: true
      }
    });
    const { options, noAuthUri, authUri, ssl } = initConfig(config);

    expect(options.url).to.be('http://localhost:9210');
    expect(options.configSource).to.be('monitoring');
    expect(authUri.auth).to.be('monitoringuser:monitoringpass');
    expect(noAuthUri.auth).to.eql(null);
    expect(ssl.rejectUnauthorized).to.be(true);
    expect(config.set.called).to.be(false);
  });
});

describe('File Reading Utility', () => {
  it('Reads a utf8 file synchronously', () => {
    const { readFile } = initConfig(getMockConfig());
    const result = readFile(join(__dirname, '/fixture_read_file.txt'));
    expect(result).to.be('another jejune test file\n');
  });
});

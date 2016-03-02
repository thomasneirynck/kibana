import ensureVersions from '../ensure_versions';
import expect from 'expect.js';
import _ from 'lodash';

describe('Ensure Kibana Version', () => {
  it('version check passes', () => {
    const plugin = _.set({}, 'kbnServer.version', '4.3.1');
    const pkg = _.set({}, 'version', '2.1.0');
    const result = ensureVersions(plugin, pkg);
    expect(result).to.be.eql({
      kibanaVersion: '4.3.1',
      monitoringVersion: '2.1.0',
      isKibanaSupported: true
    });
  });
  it('version check fails', () => {
    const plugin = _.set({}, 'kbnServer.version', '5.0.0');
    const pkg = _.set({}, 'version', '2.1.0');
    const result = ensureVersions(plugin, pkg);
    expect(result.isKibanaSupported).to.be.eql(false);
  });
  it('version check not possible', () => {
    const plugin = _.set({}, 'kbnServer.version', undefined);
    const pkg = _.set({}, 'version', 'foo');
    const result = ensureVersions(plugin, pkg);
    expect(result.isKibanaSupported).to.be.eql(false);
  });
});

/*
 * Ensure version compatibility with Kibana
 * Monitoring 2.2.0 should work with Kibana > v4.4.0
 * https://www.elastic.co/guide/en/monitoring/current/installing-monitoring.html
 * Semver tester: http://jubianchi.github.io/semver-check/
 */
import { get } from 'lodash';
import { satisfies } from 'semver';
import processVersionString from './process_version_string';

const kbnVersionRanges = {
  '2.1.0': '^4.3.0',
  '2.1.1': '^4.3.0',
  '2.1.2': '^4.3.0',
  '2.2.0': '^4.3.0',
  '2.3.0': '^5.0.0',
  '3.0.0': '^5.0.0'
};

function checkKbnVersion(plugin, pkg) {

  const kibanaVersion = processVersionString(get(plugin, 'kbnServer.version'));
  const monitoringVersion = processVersionString(pkg.version);
  const returnData = { kibanaVersion, monitoringVersion };

  // version support check can throw a TypeError if kibanaVersion is invalid
  try {
    returnData.isKibanaSupported = satisfies(kibanaVersion, kbnVersionRanges[monitoringVersion]);
  } catch (e) {
    returnData.isKibanaSupported = false;
  }

  return returnData;

}

export default checkKbnVersion;

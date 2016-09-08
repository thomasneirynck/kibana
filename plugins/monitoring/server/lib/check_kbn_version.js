/*
 * Ensure version compatibility with Kibana
 * Monitoring 2.2.0 should work with Kibana > v4.4.0
 * https://www.elastic.co/guide/en/monitoring/current/installing-monitoring.html
 * Semver tester: http://jubianchi.github.io/semver-check/
 */
import { get } from 'lodash';
import { satisfies } from 'semver';
import normalizeVersionString from './normalize_version_string';

// keep list of old versions for support reference
const kbnVersionRanges = {
  '2.0.0': '~4.2.0',
  '2.1.0': '~4.3.0',
  '2.2.0': '~4.4.0',
  '2.3.0': '~4.5.0',
  '5.0.0': '~5.0.0',
  '5.1.0': '~5.1.0'
};

function checkKbnVersion(plugin, pkg) {

  const kibanaVersion = normalizeVersionString(get(plugin, 'kbnServer.version'));
  const monitoringVersion = normalizeVersionString(pkg.version);
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

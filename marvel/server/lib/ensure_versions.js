/*
 * Ensure version compatibility with Kibana
 * Marvel 2.2.0 should work with Kibana > v4.4.0
 * https://www.elastic.co/guide/en/marvel/current/installing-marvel.html
 * Semver tester: http://jubianchi.github.io/semver-check/
 */
import _ from 'lodash';
import { satisfies } from 'semver';

const kbnVersionRanges = {
  '2.1.0': '^4.3.0',
  '2.1.1': '^4.3.0',
  '2.1.2': '^4.3.0',
  '2.2.0': '^4.3.0',
  '2.3.0': '^5.0.0',
};

function cleanVersionString(string) {
  if (string) {
    // get just the number.number.number portion (filter out '-snapshot')
    const matches = string.match(/^\d+\.\d+.\d+/);
    if (matches) {
      // escape() because the string could be rendered in UI
      return _.escape(matches[0]);
    }
  }

  return '';
}

function ensureVersions(plugin, server) {

  const kibanaVersion = cleanVersionString(_.get(plugin, 'kbnServer.version'));
  const marvelVersion = cleanVersionString(_.get(plugin, 'pkg.version'));
  const returnData = { kibanaVersion, marvelVersion };

  // version support check can throw a TypeError if kibanaVersion is invalid
  try {
    returnData.isKibanaSupported = satisfies(kibanaVersion, kbnVersionRanges[marvelVersion]);
  } catch (e) {
    returnData.isKibanaSupported = false;
  }

  return returnData;

}

export default ensureVersions;

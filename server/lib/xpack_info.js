import { createHash } from 'crypto';
import moment from 'moment';
import { get, set, includes, isFunction, forIn } from 'lodash';
import Poller from './poller';
import { LICENSE_EXPIRY_SOON_DURATION, XPACK_INFO_API_DEFAULT_POLL_FREQUENCY } from './constants';

export default function xpackInfo(server, client, pollFrequencyInMillis) {

  pollFrequencyInMillis = pollFrequencyInMillis || XPACK_INFO_API_DEFAULT_POLL_FREQUENCY.asMilliseconds();

  let _cachedResponseFromElasticsearch;
  let _cachedResponseFromElasticsearchSignature;

  let _licenseCheckResultsGenerators = {};
  let _licenseCheckResults = {};

  const poller = new Poller({
    functionToPoll: _callElasticsearchXPackAPI,
    successFunction: _handleResponseFromElasticsearch,
    errorFunction: _handleErrorFromElasticsearch,
    pollFrequencyInMillis,
    continuePollingOnError: true
  });

  const xpackInfoObject = {
    license: {
      isActive: function () {
        return get(_cachedResponseFromElasticsearch, 'license.status') === 'active';
      },
      expiresSoon: function () {
        const expiryDateMillis = get(_cachedResponseFromElasticsearch, 'license.expiry_date_in_millis');
        const expirySoonDate = moment.utc(expiryDateMillis).subtract(LICENSE_EXPIRY_SOON_DURATION);
        return moment.utc().isAfter(expirySoonDate);
      },
      getExpiryDateInMillis: function () {
        return get(_cachedResponseFromElasticsearch, 'license.expiry_date_in_millis');
      },
      isOneOf: function (candidateLicenses) {
        if (!Array.isArray(candidateLicenses)) {
          candidateLicenses = [ candidateLicenses ];
        }
        return includes(candidateLicenses, get(_cachedResponseFromElasticsearch, 'license.mode'));
      },
      getType: function () {
        return get(_cachedResponseFromElasticsearch, 'license.type');
      }
    },
    feature: function (feature) {
      return {
        isAvailable: function () {
          return get(_cachedResponseFromElasticsearch, 'features.' + feature + '.available');
        },
        isEnabled: function () {
          return get(_cachedResponseFromElasticsearch, 'features.' + feature + '.enabled');
        },
        registerLicenseCheckResultsGenerator: function (generator) {
          if (isFunction(generator)) {
            _licenseCheckResultsGenerators[feature] = generator;
          }
          _generateLicenseCheckResults();
        }
      };
    },
    getSignature: function () {
      return _cachedResponseFromElasticsearchSignature;
    },
    refreshNow: function () {
      const self = this;
      return _callElasticsearchXPackAPI()
      .then(_handleResponseFromElasticsearch)
      .catch(_handleErrorFromElasticsearch)
      .then(() => self);
    },
    stopPolling: function () {
      // This method exists primarily for unit testing
      poller.stop();
    },
    toJSON: function () {
      let json = {};

      // Set response elements common to all features
      set(json, 'license.type', xpackInfoObject.license.getType());
      set(json, 'license.isActive', xpackInfoObject.license.isActive());
      set(json, 'license.expiryDateInMillis', xpackInfoObject.license.getExpiryDateInMillis());

      // Set response elements for each of the features
      set(json, 'features', _licenseCheckResults);

      return json;
    }
  };

  function _callElasticsearchXPackAPI() {
    server.log([ 'license', 'debug', 'plugin:xpackMain' ], 'Calling Elasticsearch _xpack API');
    return client.transport.request({
      method: 'GET',
      path: '_xpack'
    });
  };

  function _computeResponseFromElasticsearchSignature(response) {
    const data = [
      get(response, 'license.status'),
      get(response, 'license.expiry_date_in_millis', '').toString(),
      get(response, 'license.mode')
    ].join('|');

    return createHash('md5')
    .update(data)
    .digest('hex');
  }

  function _generateLicenseCheckResults() {
    // Set response elements specific to each feature. To do this,
    // call the license check results generator for each feature, passing them
    // the xpack info object
    forIn(_licenseCheckResultsGenerators, (generator, feature) => {
      const licenseCheckResultsForFeature = generator(xpackInfoObject); // return value expected to be a dictionary object
      _licenseCheckResults[feature] = licenseCheckResultsForFeature;
    });
  }

  function _getLicenseInfoForLog(response) {
    const mode = get(response, 'license.mode');
    const status = get(response, 'license.status');
    const expiryDateInMillis = get(response, 'license.expiry_date_in_millis');

    return [
      'mode: ' + mode,
      'status: ' + status,
      'expiry date: ' + moment(expiryDateInMillis, 'x').format()
    ].join(' | ');
  }

  function _handleResponseFromElasticsearch(response) {
    const responseSignature = _computeResponseFromElasticsearchSignature(response);
    if (_cachedResponseFromElasticsearchSignature !== responseSignature) {

      let changed = '';
      if (_cachedResponseFromElasticsearchSignature) {
        changed = 'changed ';
      }

      const licenseInfo = _getLicenseInfoForLog(response);
      const logMessage = `Imported ${changed}license information from Elasticsearch: ${licenseInfo}`;
      server.log([ 'license', 'info', 'plugin:xpackMain'  ], logMessage);

      _cachedResponseFromElasticsearchSignature = responseSignature;
      _cachedResponseFromElasticsearch = response;
      _generateLicenseCheckResults();
    }
  }

  function _handleErrorFromElasticsearch(error) {
    server.log([ 'license', 'debug', 'plugin:xpackMain' ], 'License information could not be obtained from Elasticsearch. ' + error);
  }

  // Start polling for changes
  return poller.start()
  .then(() => xpackInfoObject);
}

import { createHash } from 'crypto';
import moment from 'moment';
import { get, set, includes, isFunction, forIn } from 'lodash';
import Poller from './poller';
import { LICENSE_EXPIRY_SOON_DURATION, XPACK_INFO_API_DEFAULT_POLL_FREQUENCY } from './constants';

export default function xpackInfo(server, client, pollFrequencyInMillis) {

  pollFrequencyInMillis = pollFrequencyInMillis || XPACK_INFO_API_DEFAULT_POLL_FREQUENCY.asMilliseconds();

  let _cachedResponseFromElasticsearch;
  let _cachedResponseFromElasticsearchSignature;

  let _uiVarGenerators = {};
  let _responseForUI = {};

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
        registerUIVarsGenerator: function (generator) {
          if (isFunction(generator)) {
            _uiVarGenerators[feature] = generator;
          }
          _generateResponseForUI();
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
      return _responseForUI;
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

  function _generateResponseForUI() {
    // Call UI var generators for each feature, passing them xpack info object
    forIn(_uiVarGenerators, (generator, feature) => {
      const uiVarsForFeature = generator(xpackInfoObject); // expected to be a dictionary object
      set(_responseForUI, [ 'features', feature ], uiVarsForFeature);
    });
  }

  function _handleResponseFromElasticsearch(response) {
    const responseSignature = _computeResponseFromElasticsearchSignature(response);
    if (_cachedResponseFromElasticsearchSignature !== responseSignature) {
      server.log([ 'license', 'info', 'plugin:xpackMain'  ], 'Got changed license information from Elasticsearch');
      _cachedResponseFromElasticsearchSignature = responseSignature;
      _cachedResponseFromElasticsearch = response;
      _generateResponseForUI();
    }
  }

  function _handleErrorFromElasticsearch(error) {
    server.log([ 'license', 'debug', 'plugin:xpackMain' ], 'License information could not be obtained from Elasticsearch. ' + error);
  }

  // Start polling for changes
  return poller.start()
  .then(() => xpackInfoObject);
}

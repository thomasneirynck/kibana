import { createHash } from 'crypto';
import moment from 'moment';
import { get, includes } from 'lodash';
import Poller from './poller';

const EXPIRY_SOON_DURATION = moment.duration(30, 'days');
const DEFAULT_POLL_FREQUENCY = moment.duration(30, 'seconds');

export default function xpackInfo(server, client, pollFrequencyInMillis) {

  pollFrequencyInMillis = pollFrequencyInMillis || DEFAULT_POLL_FREQUENCY.asMilliseconds();

  let _cachedResponse;
  let _cachedResponseSignature;

  function _callElasticsearchXPackAPI() {
    server.log([ 'license', 'debug', 'plugin:xpackMain' ], 'Calling Elasticsearch _xpack API');
    return client.transport.request({
      method: 'GET',
      path: '_xpack'
    });
  };

  function _computeResponseSignature(response) {
    const data = get(response, 'license.status')
    + '|' + get(response, 'license.expiry_date_in_millis', '').toString()
    + '|' + get(response, 'license.mode');

    return createHash('md5')
    .update(data)
    .digest('hex');
  }

  function _handleResponse(response) {
    const responseSignature = _computeResponseSignature(response);
    if (_cachedResponseSignature !== responseSignature) {
      server.log([ 'license', 'info', 'plugin:xpackMain'  ], 'License information refreshed from Elasticsearch');
      _cachedResponseSignature = responseSignature;
      _cachedResponse = response;
    }
  }

  // Start polling for changes
  let poller = new Poller({
    functionToPoll: _callElasticsearchXPackAPI,
    successFunction: _handleResponse,
    pollFrequencyInMillis
  });
  return poller.start()
  .then(() => {
    return {
      license: {
        isActive: function () {
          return get(_cachedResponse, 'license.status') === 'active';
        },
        expiresSoon: function () {
          const expiryDateMillis = get(_cachedResponse, 'license.expiry_date_in_millis');
          const expirySoonDate = moment.utc(expiryDateMillis).subtract(EXPIRY_SOON_DURATION);
          return moment.utc().isAfter(expirySoonDate);
        },
        isOneOf: function (candidateLicenses) {
          if (!Array.isArray(candidateLicenses)) {
            candidateLicenses = [ candidateLicenses ];
          }
          return includes(candidateLicenses, get(_cachedResponse, 'license.mode'));
        },
        getType: function () {
          return get(_cachedResponse, 'license.type');
        }
      },
      feature: function (feature) {
        return {
          isAvailable: function () {
            return get(_cachedResponse, 'features.' + feature + '.available');
          },
          isEnabled: function () {
            return get(_cachedResponse, 'features.' + feature + '.enabled');
          }
        };
      },
      getSignature: function () {
        return _cachedResponseSignature;
      },
      stopPolling: function () {
        // This method exists primarily for unit testing
        poller.stop();
      }
    };
  });
}

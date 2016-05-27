import { createHash } from 'crypto';
import moment from 'moment';
import { get, includes } from 'lodash';

const EXPIRY_SOON_DURATION = moment.duration(30, 'days');
const DEFAULT_POLL_FREQUENCY_IN_MILLIS = 30 * 1000;

export default function xpackInfo(client, pollFrequencyInMillis) {

  pollFrequencyInMillis = pollFrequencyInMillis || DEFAULT_POLL_FREQUENCY_IN_MILLIS;

  let _cachedResponse;
  let _cachedResponseSignature;
  let _timeoutId;

  function _callElasticsearchXPackAPI() {
    return client.transport.request({
      method: 'GET',
      path: '_xpack'
    });
  };

  function _computeResponseSignature(response) {
    const data = get(response, 'license.status')
    + get(response, 'license.expiry_date_in_millis', '').toString()
    + get(response, 'license.mode');

    return createHash('md5')
    .update(data)
    .digest('hex');
  }

  function _handleResponse(response) {
    const responseSignature = _computeResponseSignature(response);
    if (_cachedResponseSignature !== responseSignature) {
      _cachedResponseSignature = responseSignature;
      _cachedResponse = response;
    }
  }

  function _pollAgain() {
    _timeoutId = setTimeout(_poll, pollFrequencyInMillis);
  };

  function _poll() {
    return _callElasticsearchXPackAPI()
    .then(_handleResponse)
    .then(_pollAgain);
  }

  // Start polling for changes
  return _poll()
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
      stopPolling: function () {
        // This method exists primarily for unit testing
        clearTimeout(_timeoutId);
        _timeoutId = null;
      }
    };
  });
}

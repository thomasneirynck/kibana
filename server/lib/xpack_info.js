import moment from 'moment';
import { get, includes } from 'lodash';

const EXPIRY_SOON_DURATION = moment.duration(30, 'days');

export default function xpackInfo(client) {
  return client.transport.request({
    method: 'GET',
    path: '_xpack'
  })
  .then(response => {
    return {
      license: {
        isActive: function () {
          return get(response, 'license.status') === 'active';
        },
        expiresSoon: function () {
          const expiryDateMillis = get(response, 'license.expiry_date_in_millis');
          const expirySoonDate = moment.utc(expiryDateMillis).subtract(EXPIRY_SOON_DURATION);
          return moment.utc().isAfter(expirySoonDate);
        },
        isOneOf: function (candidateLicenses) {
          if (!Array.isArray(candidateLicenses)) {
            candidateLicenses = [ candidateLicenses ];
          }
          return includes(candidateLicenses, get(response, 'license.mode'));
        },
        getType: function () {
          return get(response, 'license.type');
        }
      },
      feature: function (feature) {
        return {
          isAvailable: function () {
            return get(response, 'features.' + feature + '.available');
          },
          isEnabled: function () {
            return get(response, 'features.' + feature + '.enabled');
          }
        };
      }
    };
  });
};

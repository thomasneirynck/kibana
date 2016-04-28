/* Call the XPack Info API for feature flags and mode of license
 * Requires an authenticated client
 * Doesn't give detailed info about license
 */
import moment from 'moment';
import { get } from 'lodash';
export default function xpackInfo(client) {
  return client.transport.request({
    method: 'GET',
    path: '_xpack'
  })
  .then(response => {
    const expiryDateMillis = get(response, 'license.expiry_date_in_millis');
    const expirySoonDate = moment.utc(expiryDateMillis).subtract(30, 'days');
    const expiresSoon = moment.utc().isAfter(expirySoonDate);
    return {
      features: response.features,
      mode: response.license.mode,
      expiresSoon
    };
  });
};

/*
{ features:
   { graph:
      { description: 'Graph Data Exploration for the Elastic Stack',
        available: true,
        enabled: true },
     monitoring:
      { description: 'Monitoring for the Elastic Stack',
        available: true,
        enabled: true },
     security:
      { description: 'Security for the Elastic Stack',
        available: true,
        enabled: true },
     watcher:
      { description: 'Alerting, Notification and Automation for the Elastic Stack',
        available: true,
        enabled: true } },
  mode: 'trial',
  expiresSoon: true }
 */

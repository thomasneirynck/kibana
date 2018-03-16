import uiChrome from 'ui/chrome';
import moment from 'moment';

/**
 * Fetch Telemetry data by calling the Kibana API.
 *
 * @param {Object} $http The HTTP handler
 * @param {String} basePath The base URI
 * @param {Function} _moment moment.js, but injectable for tests
 * @return {Promise} An array of cluster Telemetry objects.
 */
export function fetchTelemetry($http, { basePath = uiChrome.getBasePath(), _moment = moment } = { }) {
  return $http.post(`${basePath}/api/telemetry/v1/clusters/_stats`, {
    timeRange: {
      min: _moment().subtract(20, 'minutes').toISOString(),
      max: _moment().toISOString()
    }
  });
}

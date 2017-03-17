import moment from 'moment';
import Promise from 'bluebird';
/* TODO using a relative path just for local mocha testing.
 * Revert back to webpack aliasing when these are resolved:
 * https://github.com/elastic/x-pack-kibana/issues/154
 * https://github.com/elastic/x-pack-kibana/issues/361 */
import { CONFIG_ALLOW_REPORT } from '../../common/constants';

const STORAGE_KEY = 'xpack.monitoring.data';
const REPORT_INTERVAL = 86400000; // 1 day

export class PhoneHome {

  /*
   * @param {Object} $injector - AngularJS injector service
   * @param {String} basePath - url basepath for prefixing kibana routes
   * @param {Object} attributes - values to inject (just for unit testing)
   */
  constructor($injector, basePath = '') {
    this._storage = $injector.get('localStorage');
    this._config = $injector.get('config');
    this._reportStats = $injector.get('reportStats'); // to re-check config on every tick
    this._basePath = basePath;
    this._$http = $injector.get('$http');
    this._statsReportUrl = $injector.get('statsReportUrl');
    this._attributes = this._storage.get(STORAGE_KEY) || {};
  }

  _set(key, value) {
    this._attributes[key] = value;
  }

  _get(key) {
    return this._attributes[key];
  }

  _saveToBrowser() {
    this._storage.set(STORAGE_KEY, this._attributes);
  }

  /*
   * Check time interval passage
   */
  _checkReportStatus() {

    // check if opt-in for phone home is enabled in config (reportStats) and
    // browser setting (config) "true"
    if (this._reportStats && this._config.get(CONFIG_ALLOW_REPORT, true)) {
      // If the last report is empty it means we've never sent an report and
      // now is the time to send it.
      if (!this._get('lastReport')) {
        return true;
      }
      // If it's been a day since we last sent an report, send one.
      if ((new Date()).getTime() - parseInt(this._get('lastReport'), 10) > REPORT_INTERVAL) {
        return true;
      }
    }

    return false;
  }

  /*
   * Call the API to get the basic cluster info from the non-timebased index
   */
  _getClusterInfo(clusterUUID) {
    const url = `${this._basePath}/api/monitoring/v1/clusters/${clusterUUID}/info`;
    return this._$http.get(url)
    .then((clusterInfoResp) => {
      return clusterInfoResp.data;
    })
    .catch(() => { return {}; });
  }

  /*
   * Check report permission and if passes, send the report
   */
  _sendIfDue() {
    if (!this._checkReportStatus()) return Promise.resolve(null);

    // call to get the latest cluster uuids with a time range to go back 20 minutes up to now
    const currentClustersUrl = `${this._basePath}/api/monitoring/v1/clusters_stats`;
    const currentClustersTimeRange = {
      min: moment().subtract(20, 'minutes').toISOString(),
      max: (new Date()).toISOString()
    };
    return this._$http.post(currentClustersUrl, {
      timeRange: currentClustersTimeRange
    })
    .then((clustersData) => clustersData.data)
    .then((clusters) => {
      return Promise.map(clusters, (cluster) => {
        // get the data per cluster uuid
        return this._getClusterInfo(cluster.cluster_uuid)
        .then((info) => {
          const req = {
            method: 'POST',
            url: this._statsReportUrl,
            data: info
          };
          // if passing data externally to Infra, suppress kbnXsrfToken
          if (this._statsReportUrl.match(/^https/)) req.kbnXsrfToken = false;
          return this._$http(req);
        });
      })
      .then((mapResult) => {
        // we sent a report, so we need to record and store the current time stamp
        this._set('lastReport', Date.now());
        this._saveToBrowser();
        return mapResult;
      })
      .catch(() => {
        // no ajaxErrorHandlers for phone home
        return Promise.resolve();
      });
    });
  }

  /*
   * Public method
   */
  start() {
    // delay the initial report to allow the user some time to read the opt-out message
    let hasWaited = false;

    // continuously check if it's due time for a report
    window.setInterval(() => {
      if (hasWaited) {
        // throw away the return data
        this._sendIfDue();
      }
      hasWaited = true;
    }, 60000);
  }

}; // end class

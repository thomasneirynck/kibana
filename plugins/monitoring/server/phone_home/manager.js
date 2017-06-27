import { CONFIG_ALLOW_REPORT, REPORT_INTERVAL_MS } from '../../common/constants';
import { getAllStatsForServer } from '../lib/phone_home/get_all_stats';

/**
 * {@code PhoneHomeManager} determines when it is necessary to [re]send stats, and the communication
 * between the internal and external infrastructure.
 *
 * Failures to <em>send</em> are considered successful, while failures to fetch data internally
 * are considered failures and the next attempt will retry.
 */
export class PhoneHomeManager {

  constructor(server, uiSettings, sender, options = { }) {
    const { getStats = getAllStatsForServer } = options;

    this._server = server;
    this._uiSettings = uiSettings;
    this._sender = sender;
    this._lastReportMillis = 0;
    // allow tests to override methods
    this._getAllStatsForServer = getStats;
  }

  /**
   * A scehduler has been kicked off, so we should send the report if it's time to send it again.
   *
   * @return {Boolean} {@code true} if it attempted to send. {@code false} otherwise.
   */
  async sendIfDue() {
    const sentTimeMillis = Date.now() - this._lastReportMillis;

    if (sentTimeMillis > REPORT_INTERVAL_MS) {
      await this.send();

      return true;
    }

    return false;
  }

  /**
   * Attempt to send the report. This will not send the report if the UI configuration prevents it from being sent.
   *
   * @return {Promise} A promise containing the array of responses with their {@code statusCode}.
   */
  async send() {
    const allowReport = await this._uiSettings.get(CONFIG_ALLOW_REPORT, true);

    if (!allowReport) {
      return Promise.resolve([]);
    }

    const nowMillis = Date.now();
    const twentyMinutesAgoMillis = nowMillis - 20 * 60 * 60 * 1000;

    return this._getAllStatsForServer(this._server, twentyMinutesAgoMillis, nowMillis)
    .then(clusters => {
      // if we don't have anything to report, then don't pretend that we did
      if (clusters.length === 0) {
        return [];
      }

      // success or failure, we're going to try to send these only once
      this._lastReportMillis = nowMillis;

      return this._sender.sendClusters(clusters);
    })
    .catch(() => {
      // do not log anything
      return [];
    });
  }

};

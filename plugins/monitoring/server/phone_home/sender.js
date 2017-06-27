import request from 'request';
import { fromCallback } from 'bluebird';
import { receivePhoneHome } from '../lib/phone_home/receive_phone_home';
import { version } from '../../../../package.json';

/**
 * {@code PhoneHomeSender} enables the communication between the internal and external infrastructure.
 *
 * Separating this from the manager is helpful in order to simplify testing.
 */
export class PhoneHomeSender {

  constructor(server, options = { }) {
    const {
      receiver = receivePhoneHome,
      httpRequestHandler = request
    } = options;

    this._server = server;
    // allow tests to override methods
    this._receivePhoneHome = receiver;
    this._request = httpRequestHandler;
  }

  /**
   * Sending all of the {@code clusters}.
   *
   * @param {Array} clusters Every cluster to report.
   * @return {Promise} A promise containing each cluster's response.
   */
  sendClusters(clusters) {
    // TODO: support arrays after https://github.com/elastic/infra/issues/2350
    return Promise.all(clusters.map(cluster => this._sendCluster(cluster)));
  }

  /**
   * Send an individual {@code cluster}.
   *
   * @param {Object} cluster The cluster stats to report
   */
  _sendCluster(cluster) {
    const config = this._server.config();
    const statsReportUrl = config.get('xpack.monitoring.stats_report_url');
    const uuid = config.get('server.uuid');
    const data = {
      kibana_server: {
        version,
        uuid
      },
      ...cluster
    };

    if (statsReportUrl.startsWith('http')) {
      return this._sendHttp(statsReportUrl, uuid, data);
    }

    // used for debug purposes while in dev mode
    return this._sendInternal(data);
  }

  /**
   * Send the {@code data} to an internal service.
   */
  _sendInternal(data) {
    const { callWithInternalUser } = this._server.plugins.elasticsearch.getCluster('monitoring');

    return this._receivePhoneHome(callWithInternalUser, data);
  }

  /**
   * Send the {@code data} to the {@code statsReportUrl}.
   *
   * @param {String} statsReportUrl The URL to send the data too
   * @param {String} uuid The persistent Kibana UUID
   * @param {Object} data The payload to send
   */
  _sendHttp(statsReportUrl, uuid, data) {
    const req = {
      method: 'POST',
      uri: statsReportUrl,
      headers: {
        'User-Agent': `Kibana Server ${version} (${uuid})`
      },
      json: true,
      body: { data }
    };

    // convert the callback into a Promise
    return fromCallback(callback => this._request(req, callback));
  }

};

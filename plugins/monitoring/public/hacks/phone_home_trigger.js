import _ from 'lodash';
import uiModules from 'ui/modules';
import 'plugins/monitoring/services/clusters';

function phoneHomeClassFactory(Promise, monitoringClusters, $http, reportStats, statsReportUrl, features) {

  const defaults = {
    report: true,
    status: 'trial'
  };

  return class PhoneHome {

    constructor() {
      this.attributes = {};
      let storedAttributes = {};
      const monitoringData = localStorage.getItem('xpack.monitoring.data');

      try {
        storedAttributes = monitoringData && JSON.parse(monitoringData) || {};
      } catch (e) {
        console.error('Monitoring UI: error parsing locally stored monitoring data', e);
      }

      _.defaults(this.attributes, storedAttributes);
    }

    set(key, value) {
      if (typeof key === 'object') {
        this.attributes = _.assign(this.attributes, key);
      } else {
        this.attributes[key] = value;
      }
    }

    get(key) {
      if (_.isUndefined(key)) {
        return this.attributes;
      } else {
        return this.attributes[key];
      }
    }

    saveToBrowser() {
      localStorage.setItem('xpack.monitoring.data', JSON.stringify(this.attributes));
    }

    checkReportStatus() {
      const reportInterval = 86400000; // 1 day
      let sendReport = false;

      // check if opt-in for phone home is enabled in config (reportStats) and browser setting (features)
      // "true" param to isEnabled means enabled by default: assume true if setting doesn't exist yet
      if (reportStats && features.isEnabled('report', true)) {
        // If the last report is empty it means we've never sent an report and
        // now is the time to send it.
        if (!this.get('lastReport')) {
          sendReport = true;
        }
        // If it's been a day since we last sent an report, send one.
        if (new Date().getTime() - parseInt(this.get('lastReport'), 10) > reportInterval) {
          sendReport = true;
        }
      }

      return sendReport;
    }

    getClusterInfo(clusterUUID) {
      let url = `../api/monitoring/v1/clusters/${clusterUUID}/info`;
      return $http.get(url)
      .then((resp) => {
        return resp.data;
      })
      .catch(() => { return {}; });
    }

    sendIfDue() {
      if (!this.checkReportStatus()) return Promise.resolve();
      return monitoringClusters()
      .then((clusters) => {
        return Promise.map(clusters, (cluster) => {
          return this.getClusterInfo(cluster.cluster_uuid).then((info) => {
            const req = {
              method: 'POST',
              url: statsReportUrl,
              data: info
            };
            // if passing data externally to Infra, suppress kbnXsrfToken
            if (statsReportUrl.match(/^https/)) req.kbnXsrfToken = false;
            return $http(req);
          });
        }).then(() => {
          // we sent a report, so we need to record and store the current time stamp
          this.set('lastReport', Date.now());
          this.saveToBrowser();
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
          this.sendIfDue();
        }
        hasWaited = true;
      }, 60000);
    }

  }; // end class

}


function phoneHomeStart(Private) {
  const PhoneHome = Private(phoneHomeClassFactory);
  const sender = new PhoneHome();
  sender.start();
}

uiModules.get('kibana').run(phoneHomeStart);

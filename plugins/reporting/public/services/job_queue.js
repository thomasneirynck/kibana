import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import Notifier from 'ui/notify/notifier';

const module = require('ui/modules').get('reporting/job_queue');

module.service('reportingJobQueue', ($http, kbnUrl, Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  const baseUrl = '../api/reporting/jobs';
  const genericNotifier = new Notifier({ location: 'Reporting' });

  function licenseAllowsToShowThisPage() {
    return xpackInfo.get('features.reporting.showLinks')
      && xpackInfo.get('features.reporting.enableLinks');
  }

  function notifyAndRedirectToManagementOverviewPage() {
    genericNotifier.error(xpackInfo.get('features.reporting.message'));
    kbnUrl.redirect('/management');
  }

  function showError(err) {
    if (!licenseAllowsToShowThisPage()) {
      notifyAndRedirectToManagementOverviewPage();
      return Promise.reject();
    }
    var msg = err.statusText || 'Request failed';
    genericNotifier.error(msg);
    throw err;
  }

  return {
    list(page = 0) {
      const url = `${baseUrl}/list?page=${page}`;
      return $http.get(url)
      .then((res) => res.data)
      .catch(showError);
    },

    total() {
      const url = `${baseUrl}/count`;
      return $http.get(url)
      .then((res) => res.data)
      .catch(showError);
    },

    getContent(jobId) {
      const url = `${baseUrl}/output/${jobId}`;
      return $http.get(url)
      .then((res) => res.data)
      .catch(showError);
    }
  };
});

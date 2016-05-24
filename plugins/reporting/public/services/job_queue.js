import Notifier from 'ui/notify/notifier';

const module = require('ui/modules').get('reporting/job_queue');

module.service('reportingJobQueue', ($http) => {
  const baseUrl = '../api/reporting/jobs';
  const genericNotifier = new Notifier({ location: 'Reporting' });

  function showError(err) {
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

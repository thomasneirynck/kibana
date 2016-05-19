import Notifier from 'ui/notify/notifier';

const module = require('ui/modules').get('reporting/job_queue');

module.service('reportingJobQueue', ($http) => {
  const baseUrl = '../api/reporting/jobs';
  const genericNotifier = new Notifier({ location: 'Reporting' });

  return {
    list() {
      const url = `${baseUrl}/list`;
      return $http.get(url)
      .then((res) => res.data)
      .catch((err) => genericNotifier.fatal(err));
    }
  };
});

import routes from 'ui/routes';
import template from 'plugins/reporting/views/settings/jobs.html';

import 'plugins/reporting/services/job_queue';

routes.when('/settings/reporting/jobs', {
  template,
  resolve: {
    jobs(reportingJobQueue) {
      return reportingJobQueue.list();
    }
  },
  controller($scope, $route) {
    $scope.jobs = $route.current.locals.jobs;

    $scope.download = (jobId) => {
      console.log('download', jobId);
    };
  }
});

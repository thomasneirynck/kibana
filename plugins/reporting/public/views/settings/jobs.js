import routes from 'ui/routes';
import template from 'plugins/reporting/views/settings/jobs.html';

import 'plugins/reporting/services/job_queue';

function mapJobs(jobs) {
  return jobs.map((job) => {
    return {
      id: job._id,
      type: job._source.jobtype,
      created_by: job._source.created_by,
      created_at: job._source.created_at,
      started_at: job._source.started_at,
      completed_at: job._source.completed_at,
      status: job._source.status,
      content_type: job._source.output.content_type,
    };
  });
}

routes.when('/settings/reporting/jobs', {
  template,
  resolve: {
    jobs(reportingJobQueue) {
      return reportingJobQueue.list();
    }
  },
  controller($scope, $route, $window) {
    $scope.jobs = mapJobs($route.current.locals.jobs);

    $scope.download = (jobId) => {
      $window.open(`../api/reporting/jobs/download/${jobId}`);
    };
  }
});

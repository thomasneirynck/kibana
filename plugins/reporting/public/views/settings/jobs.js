import routes from 'ui/routes';
import template from 'plugins/reporting/views/settings/jobs.html';

import 'plugins/reporting/services/job_queue';
const jobPollingDelay = 5000;

function getJobs(reportingJobQueue) {
  return reportingJobQueue.list()
  .then((jobs) => mapJobs(jobs));
}

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
      content_type: job._source.output ? job._source.output.content_type : false
    };
  });
}

routes.when('/settings/reporting/jobs', {
  template,
  resolve: {
    jobs(reportingJobQueue) {
      return getJobs(reportingJobQueue);
    }
  },
  controller($scope, $route, $window, $interval, reportingJobQueue) {
    $scope.jobs = $route.current.locals.jobs;
    const int = $interval(() => {
      getJobs(reportingJobQueue).then((jobs) => $scope.jobs = jobs);
    }, jobPollingDelay);

    $scope.$on('$destroy', () => $interval.cancel(int));

    $scope.download = (jobId) => {
      $window.open(`../api/reporting/jobs/download/${jobId}`);
    };
  }
});

import 'angular-paging';
import 'plugins/reporting/services/job_queue';

import routes from 'ui/routes';
import template from 'plugins/reporting/views/settings/jobs.html';

const jobPollingDelay = 5000;
const pageSize = 10;

function getJobs(reportingJobQueue, page = 0) {
  return reportingJobQueue.list(page)
  .then((jobs) => {
    return reportingJobQueue.total()
    .then((total) => {
      const mappedJobs = mapJobs(jobs);
      return {
        jobs: mappedJobs,
        total: total,
        pages: Math.ceil(total / pageSize),
      };
    });
  });
}

function mapJobs(jobs) {
  return jobs.map((job) => {
    return {
      id: job._id,
      type: job._source.jobtype,
      object_type: job._source.payload.type,
      object_title: job._source.payload.title,
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
    page: () => 0,
    jobs(reportingJobQueue) {
      return getJobs(reportingJobQueue);
    }
  },
  controller($scope, $route, $window, $interval, reportingJobQueue) {
    const updateJobs = () => {
      return getJobs(reportingJobQueue, $scope.currentPage).then((jobs) => {
        $scope.jobs = jobs;
      });
    };

    $scope.loading = false;
    $scope.pageSize = pageSize;
    $scope.currentPage = $route.current.locals.page;
    $scope.jobs = $route.current.locals.jobs;

    // pagination logic
    $scope.setPage = (page) => {
      $scope.currentPage = page - 1;
      $scope.loading = !$scope.loading;
      updateJobs().then(() => { $scope.loading = !$scope.loading; });
    };

    // job list updating
    const int = $interval(updateJobs, jobPollingDelay);

    $scope.$on('$destroy', () => $interval.cancel(int));

    // control handlers
    $scope.download = (jobId) => {
      $window.open(`../api/reporting/jobs/download/${jobId}`);
    };
  }
});

import 'angular-paging';
import 'plugins/reporting/services/job_queue';
import 'plugins/reporting/less/main.less';

import routes from 'ui/routes';
import template from 'plugins/reporting/views/management/jobs.html';

const jobPollingDelay = 5000;
const pageSize = 10;

function getJobs(reportingJobQueue, showAll, page = 0) {
  return reportingJobQueue.list(page, showAll)
  .then((jobs) => {
    return reportingJobQueue.total(showAll)
    .then((total) => {
      const mappedJobs = mapJobs(jobs);
      return {
        jobs: mappedJobs,
        total: total,
        pages: Math.ceil(total / pageSize),
      };
    });
  })
  .catch(() => {
    return {
      jobs: [],
      total: 0,
      pages: 1,
    };
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

routes.when('/management/kibana/reporting', {
  template,
  resolve: {
    page: () => 0,
    jobs: () => [],
  },
  controller($scope, $route, $window, $interval, reportingJobQueue) {
    $scope.loading = false;
    $scope.pageSize = pageSize;
    $scope.currentPage = $route.current.locals.page;
    $scope.jobs = $route.current.locals.jobs;
    $scope.showMine = true;

    const toggleLoading = () => $scope.loading = !$scope.loading;


    const updateJobs = () => {
      const showAll = !$scope.showMine;

      return getJobs(reportingJobQueue, showAll, $scope.currentPage)
      .then((jobs) => {
        $scope.jobs = jobs;
      });
    };

    const updateJobsLoading = () => {
      toggleLoading();
      updateJobs().then(toggleLoading);
    };

    $scope.$watchMulti(['showMine', 'currentPage'], updateJobsLoading);

    // pagination logic
    $scope.setPage = (page) => {
      $scope.currentPage = page - 1;
    };

    // job list updating
    const int = $interval(() => updateJobs(), jobPollingDelay);

    $scope.$on('$destroy', () => $interval.cancel(int));

    // control handlers
    $scope.download = (jobId) => {
      $window.open(`../api/reporting/jobs/download/${jobId}`);
    };

    // fetch and show job error details
    $scope.showError = (jobId) => {
      reportingJobQueue.getContent(jobId)
      .then((doc) => {
        $scope.errorMessage = {
          job_id: jobId,
          message: doc.content,
        };
      });
    };

    // report user filter
    $scope.toggleUserFilter = (showMine) => {
      $scope.currentPage = 0;
      $scope.showMine = showMine;
    };
  }
});

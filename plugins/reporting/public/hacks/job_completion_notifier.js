import notify from 'ui/notify';
import chrome from 'ui/chrome';
import uiModules from 'ui/modules';
import { last, noop } from 'lodash';
import moment from 'moment';
import constants from '../../server/lib/constants.js';

uiModules.get('kibana')
.config(() => {
  // Intialize lastCheckedOn, if necessary
  if (!getLastCheckedOn()) {
    setLastCheckedOn(moment().subtract(constants.JOB_COMPLETION_CHECK_FREQUENCY_IN_MS, 'ms').toISOString());
  }
});

uiModules.get('kibana')
.run(($http, $interval) => {
  $interval(function startChecking() {
    getJobsCompletedSinceLastCheck($http)
    .then(jobs => jobs.forEach(showCompletionNotification));
  }, constants.JOB_COMPLETION_CHECK_FREQUENCY_IN_MS);
});

function getLastCheckedOn() {
  return window.localStorage.getItem(constants.JOB_COMPLETION_STORAGE_KEY_LAST_CHECK);
}

function setLastCheckedOn(newValue) {
  window.localStorage.setItem(constants.JOB_COMPLETION_STORAGE_KEY_LAST_CHECK, newValue);
}

function getJobsCompletedSinceLastCheck($http) {
  const lastCheckedOn = getLastCheckedOn();

  // Get all jobs in "completed" status since last check, sorted by completion time
  const apiBaseUrl = chrome.addBasePath(constants.API_BASE_URL);
  const url = `${apiBaseUrl}/jobs/list_completed_since?since=${lastCheckedOn}`;
  return $http.get(url)
  .then(res => {
    res = res.data;
    if (res.length === 0) {
      return res;
    }

    const lastJobCompletedAt = last(res)._source.completed_at;
    setLastCheckedOn(lastJobCompletedAt);
    return res;
  });
}

function downloadReport(jobId) {
  const downloadLink = chrome.addBasePath(`/api/reporting/jobs/download/${jobId}`);
  return () => window.open(downloadLink);
}

function showCompletionNotification(job) {
  const reportObjectTitle = job._source.payload.title;
  const reportObjectType = job._source.payload.type;
  const reportingSectionLink = chrome.addBasePath('/app/kibana#management/kibana/reporting');
  const notificationMessage = `Your report for the "${reportObjectTitle}" ${reportObjectType} is ready!`
  + ` Pick it up from [Management > Kibana > Reporting](${reportingSectionLink})`;
  const actions = [
    {
      text: 'Download Report',
      callback: downloadReport(job._id)
    },
    {
      text: 'OK',
      callback: noop
    }
  ];
  notify.custom(notificationMessage, {
    type: 'info',
    lifetime: 0,
    actions
  });
}

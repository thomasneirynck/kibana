import notify from 'ui/notify';
import uiModules from 'ui/modules';
import { last } from 'lodash';

const CHECK_FREQUENCY_IN_MS = 10000;
const STORAGE_KEY_LAST_CHECK = 'xpack.reporting.jobCompletionLastCheckedOn';
const API_BASE_URL = '../api/reporting/jobs';

uiModules.get('kibana')
.run(($http) => {
  setInterval(function startChecking() {
    getJobsCompletedSinceLastCheck($http)
    .then(jobs => jobs.forEach(showCompletionNotification));
  }, CHECK_FREQUENCY_IN_MS);
});

function getLastCheckedOn() {
  return window.localStorage.getItem(STORAGE_KEY_LAST_CHECK);
}

function setLastCheckedOn(newValue) {
  window.localStorage.setItem(STORAGE_KEY_LAST_CHECK, newValue);
}

function getJobsCompletedSinceLastCheck($http) {
  const lastCheckedOn = getLastCheckedOn();

  // Get all jobs in "completed" status since last check, sorted by completion time
  const url = `${API_BASE_URL}/list_completed_since?since=${lastCheckedOn}`;
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

function showCompletionNotification(job) {
  const reportObjectTitle = job._source.payload.title;
  const reportObjectType = job._source.payload.type;
  const notificationMessage = `Your report for the the "${reportObjectTitle}" ${reportObjectType} is ready!`
  + ` Pick it up from Management > Kibana > Reporting`; // TODO: Replace with rich text containing link
  notify.info(notificationMessage);
}

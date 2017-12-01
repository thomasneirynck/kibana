import moment from 'moment';

export const name = 'monitoring_clusters';
export const description = 'Get the monitoring clusters stats for the last 1 hour from the Kibana server';
export const method = 'POST';
export const path = '/api/monitoring/v1/clusters/_stats';

// Get an object with start and end times for the last 1 hour, ISO format, in UTC
function getTimeRange() {
  const end = moment();
  const start = moment(end).subtract(1, 'hour');
  return {
    min: moment.utc(start).format(),
    max: moment.utc(end).format(),
  };
}

export const body = { timeRange: getTimeRange() };

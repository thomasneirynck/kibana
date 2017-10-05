import d3 from 'd3';
import { createSelector } from 'reselect';
import {
  getFormattedResponseTime,
  getFormattedRequestsPerMinute
} from './utils';

export const getResponseTimeSeries = createSelector(
  data => data.responseTimes.dates,
  data => data.responseTimes.avg,
  data => data.responseTimes.p95,
  data => data.responseTimes.p99,
  data => data.weightedAverage,
  _getResponseTimeSeries
);

function _getResponseTimeSeries(dates, avg, p95, p99, weightedAverage) {
  return [
    {
      title: 'Avg.',
      data: getResponseTimeValues(dates, avg),
      legendValue: `${getFormattedResponseTime(weightedAverage / 1000)}`,
      type: 'area',
      color: '#3185FC',
      areaColor: 'rgba(49, 133, 252, 0.1)'
    },
    {
      title: '95th percentile',
      titleShort: '95th',
      data: getResponseTimeValues(dates, p95),
      type: 'area',
      color: '#ECAE23',
      areaColor: 'rgba(236, 174, 35, 0.1)'
    },
    {
      title: '99th percentile',
      titleShort: '99th',
      data: getResponseTimeValues(dates, p99),
      type: 'area',
      color: '#F98510',
      areaColor: 'rgba(249, 133, 16, 0.1)'
    }
  ];
}

export const getRpmSeries = createSelector(
  chartData => chartData.rpmPerStatusClass,
  chartData => chartData.rpmPerStatusClassAverage,
  _getRpmSeries
);

function _getRpmSeries(rpmPerStatusClass, rpmPerStatusClassAverage) {
  return [
    {
      title: '2xx',
      data: getRpmValues(rpmPerStatusClass.dates, rpmPerStatusClass['2xx']),
      legendValue: `${getFormattedRequestsPerMinute(
        rpmPerStatusClassAverage['2xx']
      )}`,
      type: 'line',
      color: '#3185FC'
    },
    {
      title: '3xx',
      data: getRpmValues(rpmPerStatusClass.dates, rpmPerStatusClass['3xx']),
      legendValue: `${getFormattedRequestsPerMinute(
        rpmPerStatusClassAverage['3xx']
      )}`,
      type: 'line',
      color: '#ECAE23'
    },
    {
      title: '4xx',
      data: getRpmValues(rpmPerStatusClass.dates, rpmPerStatusClass['4xx']),
      legendValue: `${getFormattedRequestsPerMinute(
        rpmPerStatusClassAverage['4xx']
      )}`,
      type: 'line',
      color: '#00B3A4'
    },
    {
      title: '5xx',
      data: getRpmValues(rpmPerStatusClass.dates, rpmPerStatusClass['5xx']),
      legendValue: `${getFormattedRequestsPerMinute(
        rpmPerStatusClassAverage['5xx']
      )}`,
      type: 'line',
      color: '#DB1374'
    }
  ];
}

function getResponseTimeValues(dates = [], yValues = []) {
  return dates.map((x, i) => ({
    x: new Date(x).getTime(),
    y: yValues[i] / 1000 // convert to ms
  }));
}

function getRpmValues(dates = [], yValues = []) {
  return dates.map((x, i) => ({
    x: new Date(x).getTime(),
    y: yValues[i]
  }));
}

export function getEmptySerie(start, end) {
  const dates = d3.time
    .scale()
    .domain([new Date(start), new Date(end)])
    .ticks();

  return [
    {
      data: dates.map(x => ({
        x: x.getTime(),
        y: 1
      }))
    }
  ];
}

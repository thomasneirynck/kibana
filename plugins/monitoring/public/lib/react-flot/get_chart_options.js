import { CHART_LINE_COLOR, CHART_TEXT_COLOR } from '../../../lib/constants';

export default function getChartOptions(options) {
  const opts = {
    legend: { show: false },
    lines: {
      show: true,
      lineWidth: 2
    },
    points: {
      show: true,
      radius: 1
    },
    yaxis: {
      color: CHART_LINE_COLOR,
      font: {
        color: CHART_TEXT_COLOR
      },
      tickFormatter: options.tickFormatter
    },
    xaxis: {
      color: CHART_LINE_COLOR,
      timezone: 'browser',
      mode: 'time',
      font: {
        color: CHART_TEXT_COLOR
      }
    },
    series: { shadowSize: 0 },
    grid: {
      margin: 0,
      borderWidth: 1,
      borderColor: CHART_LINE_COLOR,
      hoverable: true
    },
    crosshair: {
      mode: 'x',
      color: '#c66',
      lineWidth: 2
    },
    selection: {
      mode: 'x',
      color: CHART_TEXT_COLOR
    }
  };

  return opts;
}

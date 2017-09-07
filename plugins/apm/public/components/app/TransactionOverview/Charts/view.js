import React, { Component } from 'react';
import CustomPlot from '../../../shared/charts/CustomPlot';
import { STATUS } from '../../../../constants';
import { getTimefilter } from '../../../../utils/timepicker';
import {
  getFormattedResponseTime,
  getFormattedRequestsPerMinute
} from '../../../shared/charts/utils';
import styled from 'styled-components';
import { units, px } from '../../../../style/variables';

const ChartsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  user-select: none;
`;

const Chart = styled.div`width: calc(50% - ${px(units.half)});`;

export class Charts extends Component {
  state = {
    hoverIndex: null
  };

  componentDidMount() {
    loadCharts(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadCharts(nextProps);
  }

  onHover = hoverIndex => this.setState({ hoverIndex });
  onMouseLeave = () => this.setState({ hoverIndex: null });
  onSelection = selection => {
    const timefilter = getTimefilter();
    this.setState({ hoverIndex: null });
    timefilter.setTime(selection.start, selection.end);
  };

  render() {
    const { charts } = this.props;
    if (charts.status !== STATUS.SUCCESS) {
      return null;
    }

    return (
      <ChartsWrapper>
        <Chart>
          <CustomPlot
            chartTitle="Response Times"
            series={getResponseTimeSeries(charts.data)}
            onHover={this.onHover}
            onMouseLeave={this.onMouseLeave}
            onSelection={this.onSelection}
            hoverIndex={this.state.hoverIndex}
            formatYAxisValue={getFormattedResponseTime}
          />
        </Chart>

        <Chart>
          <CustomPlot
            chartTitle="Requests per minute"
            series={getRpmSeries(charts.data)}
            onHover={this.onHover}
            onMouseLeave={this.onMouseLeave}
            onSelection={this.onSelection}
            hoverIndex={this.state.hoverIndex}
            formatYAxisValue={getFormattedRequestsPerMinute}
          />
        </Chart>
      </ChartsWrapper>
    );
  }
}

function getResponseTimeValues(xValues, yValues) {
  return xValues.map((x, i) => ({
    x: new Date(x).getTime(),
    y: yValues[i] / 1000 // convert to ms
  }));
}

function getRpmValues(xValues, yValues) {
  return xValues.map((x, i) => ({
    x: new Date(x).getTime(),
    y: yValues[i]
  }));
}

function getResponseTimeSeries({ responseTimes }) {
  return [
    {
      title: 'Avg.',
      data: getResponseTimeValues(responseTimes.dates, responseTimes.avg),
      type: 'area',
      color: '#3185FC',
      areaColor: 'rgba(49, 133, 252, 0.1)'
    },
    {
      title: '95th percentile',
      titleShort: '95th',
      data: getResponseTimeValues(responseTimes.dates, responseTimes.p95),
      type: 'area',
      color: '#ECAE23',
      areaColor: 'rgba(236, 174, 35, 0.1)'
    },
    {
      title: '99th percentile',
      titleShort: '99th',
      data: getResponseTimeValues(responseTimes.dates, responseTimes.p99),
      type: 'area',
      color: '#F98510',
      areaColor: 'rgba(249, 133, 16, 0.1)'
    }
  ];
}

function getRpmSeries({ rpmPerStatusClass, rpmPerStatusClassAverage }) {
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

function loadCharts(props) {
  const { appName, start, end, transactionType } = props.urlParams;
  const shouldLoad =
    appName && start && end && transactionType && !props.charts.status;

  if (shouldLoad) {
    props.loadCharts({ appName, start, end, transactionType });
  }
}

export default Charts;

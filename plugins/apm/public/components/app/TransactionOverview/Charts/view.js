import React, { Component } from 'react';
import ResponseTime from '../../../shared/charts/ResponseTime';
import { STATUS } from '../../../../constants';
import { getTimefilter } from '../../../../utils/timepicker';

function getCoordinates(xValues, yValues) {
  return xValues.map((x, i) => ({
    x: new Date(x).getTime(),
    y: yValues[i] / 1000 // convert to ms
  }));
}

function loadCharts(props) {
  const { appName, start, end, transactionType } = props.urlParams;
  const shouldLoad =
    appName && start && end && transactionType && !props.charts.status;

  if (shouldLoad) {
    props.loadCharts({ appName, start, end, transactionType });
  }
}

export class Charts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoveredX: null
    };
  }

  componentDidMount() {
    loadCharts(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadCharts(nextProps);
  }

  onHover = node => this.setState({ hoveredX: node.x });
  onMouseLeave = () => this.setState({ hoveredX: null });
  onSelection = selection => {
    const timefilter = getTimefilter();
    timefilter.setTime(selection.start, selection.end);
  };

  render() {
    const { charts } = this.props;

    if (charts.status !== STATUS.SUCCESS) {
      return null;
    }

    const responseTimes = charts.data.responseTimes;
    const avg = getCoordinates(responseTimes.dates, responseTimes.avg);
    const p95 = getCoordinates(responseTimes.dates, responseTimes.p95);
    const p99 = getCoordinates(responseTimes.dates, responseTimes.p99);

    return (
      <ResponseTime
        avg={avg}
        p95={p95}
        p99={p99}
        onHover={this.onHover}
        onMouseLeave={this.onMouseLeave}
        hoveredX={this.state.hoveredX}
        onSelection={this.onSelection}
      />
    );
  }
}

export default Charts;

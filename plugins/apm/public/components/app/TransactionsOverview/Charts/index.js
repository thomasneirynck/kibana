import React, { Component } from 'react';

function loadCharts(props) {
  const { appName, start, end, transactionType } = props.urlParams;
  const shouldLoad =
    appName && start && end && transactionType && !props.charts.status;

  if (shouldLoad) {
    props.loadCharts({ appName, start, end, transactionType });
  }
}

export class Charts extends Component {
  componentDidMount() {
    loadCharts(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadCharts(nextProps);
  }

  render() {
    return <div>Charts: coming soon to a div near you</div>;
  }
}

export default Charts;

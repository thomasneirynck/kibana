import { isEqual } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { SparklineFlotChart } from './sparkline_flot_chart';

export class Sparkline extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.sparklineFlotChart = new SparklineFlotChart(this.chartElem, this.props.series, this.props.options);
  }

  componentWillReceiveProps({ series, options }) {
    if (!isEqual(options, this.props.options)) {
      this.sparklineFlotChart.shutdown();
      this.sparklineFlotChart = new SparklineFlotChart(this.chartElem, this.props.series, options);
    }

    if (!isEqual(series, this.props.series)) {
      this.sparklineFlotChart.update(series);
    }
  }

  shouldComponentUpdate() {
    // Return false because we're updating the chart via flot's
    // API, specifically by calling this.sparklineFlotChart.update() in
    // componentWillReceiveProps
    return false;
  }

  render() {
    return (
      <div
        className="sparkline"
        ref={elem => (this.chartElem = elem)}
      />
    );
  }

  componentWillUnmount() {
    this.sparklineFlotChart.shutdown();
  }
}

Sparkline.propTypes = {
  series: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  options: PropTypes.shape({
    xaxis: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    })
  })
};

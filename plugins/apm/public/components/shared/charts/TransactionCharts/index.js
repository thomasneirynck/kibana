import React, { Component } from 'react';
import CustomPlot from '../CustomPlot';
import { STATUS } from '../../../../constants';
import { getTimefilter } from '../../../../utils/timepicker';
import {
  getFormattedResponseTime,
  getFormattedRequestsPerMinute
} from '../utils';
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
    this.props.loadCharts(this.props);
  }

  componentWillReceiveProps(nextProps) {
    nextProps.loadCharts(nextProps);
  }

  onHover = hoverIndex => this.setState({ hoverIndex });
  onMouseLeave = () => this.setState({ hoverIndex: null });
  onSelection = selection => {
    const timefilter = getTimefilter();
    this.setState({ hoverIndex: null });
    timefilter.setTime(selection.start, selection.end);
  };

  render() {
    const { status, responseTimeSeries, rpmSeries } = this.props;

    if (status !== STATUS.SUCCESS) {
      return null;
    }

    return (
      <ChartsWrapper>
        <Chart>
          <CustomPlot
            chartTitle="Response Times"
            series={responseTimeSeries}
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
            series={rpmSeries}
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

export default Charts;

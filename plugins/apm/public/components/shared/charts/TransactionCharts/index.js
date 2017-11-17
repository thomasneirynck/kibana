import React, { Component } from 'react';
import CustomPlot from '../CustomPlot';
import { getTimefilter } from '../../../../utils/timepicker';
import { asMillis, asDecimal, tpmUnit } from '../../../../utils/formatters';
import styled from 'styled-components';
import { units, px } from '../../../../style/variables';

const ChartsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  user-select: none;
`;

const Chart = styled.div`
  width: calc(50% - ${px(units.plus)});
`;

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
  onSelectionEnd = selection => {
    const timefilter = getTimefilter();
    this.setState({ hoverIndex: null });
    timefilter.setTime(selection.start, selection.end);
  };

  getResponseTimeFormatter = t => {
    return this.props.isEmpty ? '- ms' : asMillis(t);
  };

  getRequestPerMinuteFormatter = t => {
    const unit = tpmUnit(this.props.urlParams.transactionType);
    return this.props.isEmpty ? `- ${unit}` : `${asDecimal(t)} ${unit}`;
  };

  render() {
    const { isEmpty, responseTimeSeries, rpmSeries, urlParams } = this.props;

    return (
      <ChartsWrapper>
        <Chart>
          <CustomPlot
            isEmpty={isEmpty}
            chartTitle="Response times"
            series={responseTimeSeries}
            onHover={this.onHover}
            onMouseLeave={this.onMouseLeave}
            onSelectionEnd={this.onSelectionEnd}
            hoverIndex={this.state.hoverIndex}
            tickFormatY={this.getResponseTimeFormatter}
          />
        </Chart>

        <Chart>
          <CustomPlot
            isEmpty={isEmpty}
            chartTitle={tpmLabel(urlParams.transactionType)}
            series={rpmSeries}
            onHover={this.onHover}
            onMouseLeave={this.onMouseLeave}
            onSelectionEnd={this.onSelectionEnd}
            hoverIndex={this.state.hoverIndex}
            tickFormatY={this.getRequestPerMinuteFormatter}
            truncateLegends
          />
        </Chart>
      </ChartsWrapper>
    );
  }
}

function tpmLabel(type) {
  return type === 'request' ? 'Requests per minute' : 'Transactions per minute';
}

export default Charts;

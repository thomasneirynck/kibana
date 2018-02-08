import React, { Component } from 'react';
import CustomPlot from '../CustomPlot';
import { getTimefilter } from '../../../../utils/timepicker';
import { asMillis, asDecimal, tpmUnit } from '../../../../utils/formatters';
import styled from 'styled-components';
import { units, unit, px } from '../../../../style/variables';

const ChartsWrapper = styled.div`
  display: flex;
  flex-flow: wrap;
  justify-content: space-between;
  user-select: none;
`;

const Chart = styled.div`
  flex: 0 0 100%;

  @media (min-width: ${px(unit * 60)}) {
    flex: 1 1 0%;

    &:first-child {
      margin-right: ${px(units.half)};
    }
    &:last-child {
      margin-left: ${px(units.half)};
    }
  }
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
    return this.props.charts.data.noHits ? '- ms' : asMillis(t);
  };

  getRequestPerMinuteFormatter = t => {
    const { urlParams, charts } = this.props;
    const unit = tpmUnit(urlParams.transactionType);
    return charts.data.noHits ? `- ${unit}` : `${asDecimal(t)} ${unit}`;
  };

  render() {
    const { charts, urlParams } = this.props;
    const { noHits, responseTimeSeries, rpmSeries } = charts.data;

    return (
      <ChartsWrapper>
        <Chart>
          <CustomPlot
            noHits={noHits}
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
            noHits={noHits}
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

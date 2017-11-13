import React, { PureComponent } from 'react';
import d3 from 'd3';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { scaleLinear } from 'd3-scale';
import styled from 'styled-components';
import SingleRect from './SingleRect';
import 'react-vis/dist/style.css';
import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalRectSeries,
  Voronoi,
  makeWidthFlexible,
  VerticalGridLines
} from 'react-vis';
import { unit, colors } from '../../../../style/variables';
import Tooltip from '../Tooltip';

const barColor = 'rgb(172, 189, 216)';
const XY_HEIGHT = unit * 8;
const XY_MARGIN = {
  top: unit,
  left: unit * 5,
  right: unit,
  bottom: unit * 2
};

const X_TICK_TOTAL = 10;

const ChartsWrapper = styled.div`
  user-select: none;
`;

export class HistogramInner extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hoveredBucket: null
    };
  }

  onClick = bucket => {
    if (this.props.onClick && bucket.y > 0) {
      this.props.onClick(bucket);
    }
  };

  onHover = bucket => {
    this.setState({ hoveredBucket: bucket });
  };

  onBlur = () => {
    this.setState({ hoveredBucket: null });
  };

  getChartData(items, selectedItem) {
    const yMax = Math.max(...items.map(item => item.y));
    const yMin = yMax * 0.1;

    return items.map(item => {
      const padding = (item.x - item.x0) / 20;
      return {
        ...item,
        color: item === selectedItem ? colors.blue1 : undefined,
        x0: item.x0 + padding,
        x: item.x - padding,
        y: item.y > 0 ? Math.max(item.y, yMin) : 0
      };
    });
  }

  render() {
    const {
      buckets,
      transactionId,
      bucketSize,
      width: XY_WIDTH,
      formatXValue,
      formatYValue,
      formatTooltipHeader,
      tooltipLegendTitle
    } = this.props;
    if (_.isEmpty(buckets) || XY_WIDTH === 0) {
      return null;
    }

    const selectedBucket =
      transactionId &&
      buckets.find(bucket => bucket.transactionId === transactionId);

    const xMin = d3.min(buckets, d => d.x0);
    const xMax = d3.max(buckets, d => d.x);
    const yMin = 0;
    const yMax = d3.max(buckets, d => d.y);
    const chartData = this.getChartData(buckets, selectedBucket);

    const x = scaleLinear()
      .domain([xMin, xMax])
      .range([XY_MARGIN.left, XY_WIDTH - XY_MARGIN.right]);
    const y = scaleLinear()
      .domain([yMin, yMax])
      .range([XY_HEIGHT, 0])
      .nice();

    const xDomain = x.domain();
    const yDomain = y.domain();
    const yTickValues = [0, yDomain[1] / 2, yDomain[1]];
    const hoveredBucket = this.state.hoveredBucket || {};
    const isTimeSeries = this.props.xType === 'time';
    const shouldShowTooltip =
      hoveredBucket.x > 0 && (hoveredBucket.y > 0 || isTimeSeries);

    return (
      <ChartsWrapper>
        <XYPlot
          xType={this.props.xType}
          width={XY_WIDTH}
          height={XY_HEIGHT}
          margin={XY_MARGIN}
          xDomain={xDomain}
          yDomain={yDomain}
        >
          <HorizontalGridLines tickValues={yTickValues} />
          <XAxis
            style={{ strokeWidth: '1px' }}
            marginRight={10}
            tickSizeOuter={10}
            tickSizeInner={0}
            tickTotal={X_TICK_TOTAL}
            tickFormat={formatXValue}
          />
          <YAxis
            tickSize={0}
            hideLine
            tickValues={yTickValues}
            tickFormat={formatYValue}
          />
          {this.props.onClick &&
            _.get(this.state.hoveredBucket, 'y') > 0 && (
              <SingleRect
                x={x(this.state.hoveredBucket.x0)}
                width={x(bucketSize) - x(0)}
                style={{
                  fill: colors.gray4
                }}
              />
            )}

          {shouldShowTooltip && (
            <Tooltip
              style={{
                marginLeft: '1%',
                marginRight: '1%'
              }}
              header={formatTooltipHeader(hoveredBucket.x0, hoveredBucket.x)}
              tooltipPoints={[
                {
                  color: barColor,
                  value: formatYValue(hoveredBucket.y, false),
                  text: tooltipLegendTitle
                }
              ]}
              x={hoveredBucket.x}
              y={yDomain[1] / 2}
            />
          )}
          {selectedBucket && (
            <SingleRect
              x={x(selectedBucket.x0)}
              width={x(bucketSize) - x(0)}
              style={{
                fill: 'transparent',
                stroke: 'rgb(172, 189, 220)'
              }}
            />
          )}
          <VerticalRectSeries
            colorType="literal"
            color="rgb(172, 189, 216)"
            data={chartData}
            style={{
              rx: '2px',
              ry: '2px'
            }}
          />
          {isTimeSeries &&
            hoveredBucket.x > 0 && (
              <VerticalGridLines tickValues={[hoveredBucket.x]} />
            )}
          <Voronoi
            extent={[[XY_MARGIN.left, XY_MARGIN.top], [XY_WIDTH, XY_HEIGHT]]}
            nodes={this.props.buckets.map(item => ({
              ...item,
              x: (item.x0 + item.x) / 2
            }))}
            onClick={this.onClick}
            onHover={this.onHover}
            onBlur={this.onBlur}
            x={d => x(d.x)}
            y={() => 1}
          />
        </XYPlot>
      </ChartsWrapper>
    );
  }
}

HistogramInner.propTypes = {
  width: PropTypes.number.isRequired,
  transactionId: PropTypes.string,
  bucketSize: PropTypes.number.isRequired,
  onClick: PropTypes.func,
  buckets: PropTypes.array.isRequired,
  xType: PropTypes.string,
  formatXValue: PropTypes.func,
  formatYValue: PropTypes.func,
  formatTooltipHeader: PropTypes.func,
  tooltipLegendTitle: PropTypes.string
};

HistogramInner.defaultProps = {
  formatTooltipHeader: () => null,
  formatYValue: value => value,
  xType: 'linear'
};

export default makeWidthFlexible(HistogramInner);

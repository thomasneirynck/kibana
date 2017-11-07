import React, { PureComponent } from 'react';
import d3 from 'd3';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { scaleLinear } from 'd3-scale';
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
import { colors } from '../../../../style/variables';
import Tooltip from '../Tooltip';

const barColor = 'rgb(172, 189, 216)';
const XY_HEIGHT = 120;
const XY_MARGIN = {
  top: 20,
  left: 50,
  right: 10
};

const X_TICK_TOTAL = 10;

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
    return items
      .map(item => ({
        ...item,
        color: item === selectedItem ? colors.blue1 : undefined
      }))
      .map(item => {
        const padding = (item.x - item.x0) / 20;
        return { ...item, x: item.x - padding, x0: item.x0 + padding };
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
    const hoveredX = _.get(this.state.hoveredBucket, 'x', 0);
    const hoveredX0 = _.get(this.state.hoveredBucket, 'x0', 0);
    const hoveredY = _.get(this.state.hoveredBucket, 'y', 0);
    const isTimeSeries = this.props.xType === 'time';
    const shouldShowTooltip = hoveredX > 0 && (hoveredY > 0 || isTimeSeries);

    return (
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
            header={formatTooltipHeader(hoveredX0, hoveredX)}
            tooltipPoints={[
              {
                color: barColor,
                value: formatYValue(hoveredY, false),
                text: tooltipLegendTitle
              }
            ]}
            x={hoveredX}
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
          hoveredX > 0 && <VerticalGridLines tickValues={[hoveredX]} />}
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

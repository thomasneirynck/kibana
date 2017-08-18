import React, { PureComponent } from 'react';
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
  makeWidthFlexible
} from 'react-vis';
import { getYMax, getXMax, getYMaxRounded } from '../utils';

const XY_HEIGHT = 120;
const XY_MARGIN = {
  top: 20,
  left: 50,
  right: 10
};

const X_TICK_TOTAL = 10;

class Histogram extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hoveredBucket: null
    };
  }

  onClick = bucket => {
    if (!this.isEmpty(bucket)) {
      this.props.onClick(bucket.i);
    }
  };

  onHover = bucket => {
    if (!this.isEmpty(bucket)) {
      this.setState({ hoveredBucket: bucket });
    }
  };

  onBlur = () => {
    this.setState({ hoveredBucket: null });
  };

  isEmpty = bucket => this.props.buckets[bucket.i].y === 0;

  getChartData(items, selected) {
    return items
      .map((item, i) => ({
        ...item,
        color: i === selected ? '#3360a3' : undefined
      }))
      .map(item => {
        const padding = (item.x - item.x0) / 20;
        return { ...item, x: item.x - padding, x0: item.x0 + padding };
      });
  }

  render() {
    const { buckets, selectedBucket, bucketSize } = this.props;

    if (!buckets) {
      return null;
    }

    const XY_WIDTH = this.props.width; // from makeWidthFlexible HOC
    const xMin = 0;
    const xMax = getXMax(buckets);
    const yMin = 0;
    const yMax = getYMax(buckets);
    const yMaxRounded = getYMaxRounded(yMax);
    const yTickValues = [yMaxRounded, yMaxRounded / 2];
    const chartData = this.getChartData(buckets, selectedBucket);

    const x = scaleLinear()
      .domain([xMin, xMax])
      .range([XY_MARGIN.left, XY_WIDTH - XY_MARGIN.right]);
    const y = scaleLinear().domain([yMin, yMaxRounded]).range([XY_HEIGHT, 0]);

    return (
      <XYPlot
        width={XY_WIDTH}
        height={XY_HEIGHT}
        margin={XY_MARGIN}
        xDomain={x.domain()}
        yDomain={y.domain()}
      >
        <HorizontalGridLines tickValues={yTickValues} />
        <XAxis
          style={{ strokeWidth: '1px' }}
          marginRight={10}
          tickSizeOuter={10}
          tickSizeInner={0}
          tickTotal={X_TICK_TOTAL}
        />
        <YAxis
          tickSize={0}
          hideLine
          tickValues={yTickValues}
          tickFormat={value => `${value} reqs.`}
        />

        {this.state.hoveredBucket
          ? <SingleRect
              x={x(this.state.hoveredBucket.x0)}
              width={x(bucketSize) - x(0)}
              marginTop={XY_MARGIN.top}
              style={{
                fill: '#dddddd'
              }}
            />
          : null}

        {Number.isInteger(selectedBucket)
          ? <SingleRect
              x={x(selectedBucket * bucketSize)}
              width={x(bucketSize) - x(0)}
              marginTop={XY_MARGIN.top}
              style={{
                fill: 'transparent',
                stroke: 'rgb(172, 189, 220)'
              }}
            />
          : null}

        <VerticalRectSeries
          colorType="literal"
          color="rgb(172, 189, 216)"
          data={chartData}
          style={{
            rx: '2px',
            ry: '2px'
          }}
        />

        <Voronoi
          extent={[[XY_MARGIN.left, XY_MARGIN.top], [XY_WIDTH, XY_HEIGHT]]}
          nodes={this.props.buckets.map(item => ({
            ...item,
            x: (item.x0 + item.x) / 2,
            y: 1
          }))}
          onClick={this.onClick}
          onHover={this.onHover}
          onBlur={this.onBlur}
          x={d => x(d.x)}
          y={d => y(d.y)}
        />
      </XYPlot>
    );
  }
}

Histogram.propTypes = {
  width: PropTypes.number
};

export default makeWidthFlexible(Histogram);

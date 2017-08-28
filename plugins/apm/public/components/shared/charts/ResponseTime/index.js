import React, { PureComponent } from 'react';
import 'react-vis/dist/style.css';
import PropTypes from 'prop-types';
import Voronoi from './Voronoi';
import DragMarker from './DragMarker';

import { scaleLinear } from 'd3-scale';
import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  LineSeries,
  AreaSeries,
  MarkSeries,
  VerticalGridLines,
  makeWidthFlexible
} from 'react-vis';
import { getYMax, getYMaxRounded, getXMax, getXMin } from '../utils';

const XY_HEIGHT = 300;
const XY_MARGIN = {
  top: 50,
  left: 50,
  right: 10
};
const X_TICK_TOTAL = 7;

class ResponseTime extends PureComponent {
  state = {
    isDrawing: false,
    selectionStart: null,
    selectionEnd: null
  };

  onMouseLeave = (...args) => {
    if (this.state.isDrawing) {
      this.setState({ isDrawing: false });
    }
    this.props.onMouseLeave(...args);
  };
  onMouseDown = node =>
    this.setState({
      isDrawing: true,
      selectionStart: node.x,
      selectionEnd: null
    });
  onMouseUp = () => {
    this.setState({ isDrawing: false });

    if (this.state.selectionEnd !== null) {
      this.props.onSelection({
        start: this.state.selectionStart,
        end: this.state.selectionEnd
      });
    }
  };
  onHover = node => {
    if (this.state.isDrawing) {
      this.setState({ selectionEnd: node.x });
    }
    this.props.onHover(node);
  };

  getHoveredPoints = hoveredX => {
    const index = this.props.avg.findIndex(item => item.x === hoveredX);

    return [
      this.props.avg[index],
      this.props.p95[index],
      this.props.p99[index]
    ];
  };

  render() {
    const { hoveredX, avg, p95, p99, width } = this.props;

    const xMin = getXMin(p99);
    const xMax = getXMax(p99);
    const yMin = 0;
    const yMax = getYMax(p99);
    const yMaxRounded = getYMaxRounded(yMax);
    const yTickValues = [yMaxRounded, yMaxRounded / 2];
    const XY_WIDTH = width; // from makeWidthFlexible HOC

    const x = scaleLinear()
      .domain([xMin, xMax])
      .range([XY_MARGIN.left, XY_WIDTH - XY_MARGIN.right]);
    const y = scaleLinear().domain([yMin, yMaxRounded]).range([XY_HEIGHT, 0]);

    return (
      <div>
        <XYPlot
          onMouseLeave={this.onMouseLeave}
          width={XY_WIDTH}
          height={XY_HEIGHT}
          margin={XY_MARGIN}
          xType="time"
          xDomain={x.domain()}
          yDomain={y.domain()}
        >
          <HorizontalGridLines tickValues={yTickValues} />
          <XAxis tickTotal={X_TICK_TOTAL} />
          <YAxis
            marginLeft={XY_MARGIN.left + 50}
            marginTop={XY_MARGIN.top + 10}
            tickSize={0}
            hideLine
            tickValues={yTickValues}
            tickFormat={t => `${t} ms`}
          />

          <AreaSeries
            curve={'curveMonotoneX'}
            data={p95}
            color="rgba(26, 49, 119, 0.6)"
          />

          <AreaSeries
            xType="time"
            curve={'curveMonotoneX'}
            data={p99}
            color="rgba(121, 199, 227, 0.5)"
          />

          <LineSeries xType="time" curve={'curveMonotoneX'} data={avg} />

          {hoveredX !== null &&
            !this.state.isDrawing &&
            <MarkSeries data={this.getHoveredPoints(hoveredX)} />}

          <MarkSeries
            fill="transparent"
            stroke="transparent"
            data={avg.map(point => ({ ...point, y: 0 }))}
          />

          {hoveredX !== null && <VerticalGridLines tickValues={[hoveredX]} />}

          <Voronoi
            extent={[[XY_MARGIN.left, XY_MARGIN.top], [XY_WIDTH, XY_HEIGHT]]}
            nodes={avg}
            onHover={this.onHover}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            x={d => x(d.x)}
            y={() => 0}
          />

          {this.state.isDrawing &&
            this.state.selectionEnd !== null &&
            <DragMarker
              selectionStart={x(this.state.selectionStart)}
              selectionEnd={x(this.state.selectionEnd)}
            />}
        </XYPlot>
      </div>
    );
  }
}

ResponseTime.displayName = 'ResponseTime';
ResponseTime.propTypes = {
  width: PropTypes.number,
  onHover: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onSelection: PropTypes.func
};

export default makeWidthFlexible(ResponseTime);

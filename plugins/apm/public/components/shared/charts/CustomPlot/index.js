import React, { PureComponent } from 'react';
import _ from 'lodash';
import 'react-vis/dist/style.css';
import PropTypes from 'prop-types';
import SelectionMarker from './SelectionMarker';
import d3 from 'd3';
import { scaleLinear } from 'd3-scale';
import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  LineSeries,
  AreaSeries,
  MarkSeries,
  Voronoi,
  VerticalGridLines,
  makeWidthFlexible
} from 'react-vis';
import { CustomHint } from './CustomHint';
import { Legend } from './Legend';
import styled from 'styled-components';
import { units, fontSizes, px } from '../../../../style/variables';

const XY_HEIGHT = 250;
const XY_MARGIN = {
  top: 25,
  left: 55,
  right: 15
};
const X_TICK_TOTAL = 7;

const ChartWrapper = styled.div`padding: ${px(units.half)};`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled.div`font-size: ${fontSizes.large};`;

const Legends = styled.div`
  display: flex;
  align-items: center;
`;

class CustomPlot extends PureComponent {
  state = {
    isDrawing: false,
    selectionStart: null,
    selectionEnd: null,
    disabledSeries: []
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
    if (this.state.selectionEnd !== null) {
      this.props.onSelection({
        start: this.state.selectionStart,
        end: this.state.selectionEnd
      });
    }
    this.setState({ isDrawing: false });
  };

  onHover = node => {
    const index = this.props.series[0].data.findIndex(
      item => item.x === node.x
    );
    this.props.onHover(index);

    if (this.state.isDrawing) {
      this.setState({ selectionEnd: node.x });
    }
  };

  clickLegend = i => {
    this.setState(({ disabledSeries }) => {
      const disabledSeriesOrDefault = _.isEmpty(disabledSeries)
        ? this.props.series.map(() => false)
        : disabledSeries;

      return {
        disabledSeries: disabledSeriesOrDefault.map(
          (value, _i) => (i === _i ? !value : value)
        )
      };
    });
  };

  getHoveredPoints = hoverIndex => {
    if (hoverIndex === null) {
      return [];
    }

    return this.getEnabledSeries(this.props.series).map(
      serie => serie.data[hoverIndex]
    );
  };

  getEnabledSeries(series) {
    return series.filter((serie, i) => !this.state.disabledSeries[i]);
  }

  getSerie(serie) {
    switch (serie.type) {
      case 'line':
        return (
          <LineSeries
            key={serie.title}
            xType="time"
            curve={'curveMonotoneX'}
            data={serie.data}
            color={serie.color}
          />
        );
      case 'area':
        return (
          <AreaSeries
            key={serie.title}
            xType="time"
            curve={'curveMonotoneX'}
            data={serie.data}
            color={serie.color}
            stroke={serie.color}
            fill={serie.areaColor}
          />
        );
      default:
        throw new Error(`Unknown type ${serie.type}`);
    }
  }

  render() {
    const {
      chartTitle,
      hoverIndex,
      series,
      width: XY_WIDTH,
      formatYAxisValue
    } = this.props;
    const { isDrawing, selectionStart, selectionEnd } = this.state;

    if (_.isEmpty(series) || XY_WIDTH === 0) {
      return null;
    }

    const defaultSerie = series[0].data;
    const allCoordinates = _.flatten(series.map(serie => serie.data));

    const xMin = d3.min(allCoordinates, d => d.x);
    const xMax = d3.max(allCoordinates, d => d.x);
    const yMin = 0;
    const yMax = d3.max(allCoordinates, d => d.y);

    const hoveredPoints = this.getHoveredPoints(hoverIndex);

    const x = scaleLinear()
      .domain([xMin, xMax])
      .range([XY_MARGIN.left, XY_WIDTH - XY_MARGIN.right]);
    const y = scaleLinear()
      .domain([yMin, yMax])
      .range([XY_HEIGHT, 0])
      .nice();

    const yDomainNice = y.domain();
    const yTickValues = [0, yDomainNice[1] / 2, yDomainNice[1]];

    return (
      <ChartWrapper>
        <Header>
          <Title>{chartTitle}</Title>
          <Legends>
            {series.map((serie, i) => (
              <Legend
                key={i}
                i={i}
                serie={serie}
                onClick={this.clickLegend}
                isDisabled={this.state.disabledSeries[i]}
              />
            ))}
          </Legends>
        </Header>

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
          <XAxis tickSize={0} tickTotal={X_TICK_TOTAL} />
          <YAxis
            tickSize={0}
            tickValues={yTickValues}
            tickFormat={formatYAxisValue}
          />

          {hoverIndex !== null &&
          !isDrawing && (
            <CustomHint
              hoveredPoints={hoveredPoints}
              series={series}
              valueFormatter={formatYAxisValue}
              y={0}
            />
          )}

          {this.getEnabledSeries(series)
            .reverse()
            .map(this.getSerie)}

          {hoverIndex !== null &&
          !isDrawing && <MarkSeries data={hoveredPoints} />}

          <MarkSeries
            fill="transparent"
            stroke="transparent"
            data={defaultSerie.map(point => ({ ...point, y: 0 }))}
          />

          {hoverIndex !== null && (
            <VerticalGridLines tickValues={[defaultSerie[hoverIndex].x]} />
          )}

          <Voronoi
            extent={[[XY_MARGIN.left, XY_MARGIN.top], [XY_WIDTH, XY_HEIGHT]]}
            nodes={defaultSerie}
            onHover={this.onHover}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            x={d => x(d.x)}
            y={() => 0}
          />

          {isDrawing &&
          selectionEnd !== null && (
            <SelectionMarker start={x(selectionStart)} end={x(selectionEnd)} />
          )}
        </XYPlot>
      </ChartWrapper>
    );
  }
}

CustomPlot.propTypes = {
  width: PropTypes.number,
  onHover: PropTypes.func,
  onBlur: PropTypes.func
};

export default makeWidthFlexible(CustomPlot);

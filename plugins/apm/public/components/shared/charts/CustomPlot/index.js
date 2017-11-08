import React, { PureComponent } from 'react';
import _ from 'lodash';
import 'react-vis/dist/style.css';
import PropTypes from 'prop-types';
import d3 from 'd3';
import { scaleLinear } from 'd3-scale';
import { XYPlot, makeWidthFlexible } from 'react-vis';
import Legend from '../Legend';
import styled from 'styled-components';
import { units, fontSizes, px, colors } from '../../../../style/variables';
import StaticPlot from './StaticPlot';
import InteractivePlot from './InteractivePlot';
import VoronoiPlot from './VoronoiPlot';

const XY_HEIGHT = 250;
const XY_MARGIN = {
  top: 25,
  left: 70,
  right: 15
};

const ChartWrapper = styled.div`
  padding: ${px(units.half)} 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled.div`
  font-size: ${fontSizes.large};
`;

const Legends = styled.div`
  display: flex;
  align-items: center;
`;

const SeriesValue = styled.span`
  margin-left: ${px(units.quarter)};
  color: ${colors.black};
  display: inline-block;
`;

const LegendContent = styled.span`
  white-space: nowrap;
  color: ${colors.gray3};
`;

const getXScale = _.memoize(
  (xMin, xMax, width) => {
    return scaleLinear()
      .domain([xMin, xMax])
      .range([XY_MARGIN.left, width - XY_MARGIN.right]);
  },
  (...args) => args.join('_')
);

const getYScale = _.memoize(
  (yMin, yMax) => {
    return scaleLinear()
      .domain([yMin, yMax])
      .range([XY_HEIGHT, 0])
      .nice();
  },
  (...args) => args.join('_')
);

const getYTickValues = _.memoize(yMaxNice => [0, yMaxNice / 2, yMaxNice]);
const getXYPlot = _.memoize(
  (x, y, width) => {
    function XYPlotWrapper(props) {
      return (
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <XYPlot
            dontCheckIfEmpty
            width={width}
            height={XY_HEIGHT}
            margin={XY_MARGIN}
            xType="time"
            xDomain={x.domain()}
            yDomain={y.domain()}
            {...props}
          />
        </div>
      );
    }

    return XYPlotWrapper;
  },
  (x, y, width) => [...x.domain(), ...y.domain(), width].join('_')
);

const getEnabledSeries = (series, seriesVisibility) => {
  return series.filter((serie, i) => !seriesVisibility[i]);
};

export class InnerCustomPlot extends PureComponent {
  state = {
    seriesVisibility: [],
    enabledSeries: [],
    isDrawing: false,
    selectionStart: null,
    selectionEnd: null
  };

  componentWillMount() {
    this.setState({
      enabledSeries: getEnabledSeries(
        this.props.series,
        this.state.seriesVisibility
      )
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.series !== nextProps.series) {
      this.setState({
        enabledSeries: getEnabledSeries(
          nextProps.series,
          this.state.seriesVisibility
        )
      });
    }
  }

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
      this.props.onSelectionEnd({
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
    this.setState(({ seriesVisibility }) => {
      const nextSeriesVisibility = this.props.series.map((value, _i) => {
        const disabledValue = seriesVisibility[_i];
        return i === _i ? !disabledValue : !!disabledValue;
      });

      return {
        seriesVisibility: nextSeriesVisibility,
        enabledSeries: getEnabledSeries(this.props.series, nextSeriesVisibility)
      };
    });
  };

  render() {
    const { chartTitle, series, width } = this.props;
    if (_.isEmpty(series)) {
      return null;
    }

    const allCoordinates = _.flatten(series.map(serie => serie.data));
    const xMin = d3.min(allCoordinates, d => d.x);
    const xMax = d3.max(allCoordinates, d => d.x);
    const yMin = 0;
    const yMax = d3.max(allCoordinates, d => d.y);

    const x = getXScale(xMin, xMax, width);
    const y = getYScale(yMin, yMax);
    const yTickValues = getYTickValues(y.domain()[1]);

    const { enabledSeries } = this.state;

    return (
      <ChartWrapper>
        <Header>
          <Title>{chartTitle}</Title>
          <Legends>
            {series.filter(serie => !serie.isEmpty).map((serie, i) => {
              const text = (
                <LegendContent>
                  {serie.title}{' '}
                  {serie.legendValue && (
                    <SeriesValue>{serie.legendValue}</SeriesValue>
                  )}
                </LegendContent>
              );
              return (
                <Legend
                  key={i}
                  onClick={() => this.clickLegend(i)}
                  disabled={this.state.seriesVisibility[i]}
                  text={text}
                  color={serie.color}
                />
              );
            })}
          </Legends>
        </Header>

        <div style={{ position: 'relative', height: XY_HEIGHT }}>
          <StaticPlot
            series={enabledSeries}
            tickFormatY={this.props.tickFormatY}
            tickFormatX={this.props.tickFormatX}
            XYPlot={getXYPlot(x, y, width)}
            yTickValues={yTickValues}
          />

          <InteractivePlot
            hoverIndex={this.props.hoverIndex}
            series={enabledSeries}
            tickFormatY={this.props.tickFormatY}
            XYPlot={getXYPlot(x, y, width)}
            x={x}
            isDrawing={this.state.isDrawing}
            selectionStart={this.state.selectionStart}
            selectionEnd={this.state.selectionEnd}
          />

          <VoronoiPlot
            width={width}
            series={series}
            XY_MARGIN={XY_MARGIN}
            XY_HEIGHT={XY_HEIGHT}
            XYPlot={getXYPlot(x, y, width)}
            x={x}
            onHover={this.onHover}
            onMouseLeave={this.onMouseLeave}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
          />
        </div>
      </ChartWrapper>
    );
  }
}

InnerCustomPlot.propTypes = {
  width: PropTypes.number.isRequired,
  series: PropTypes.array.isRequired,
  onHover: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onSelectionEnd: PropTypes.func.isRequired,
  hoverIndex: PropTypes.number,
  tickFormatY: PropTypes.func
};

InnerCustomPlot.defaultProps = {
  tickFormatY: y => y
};

export default makeWidthFlexible(InnerCustomPlot);

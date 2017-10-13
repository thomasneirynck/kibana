import React, { PureComponent } from 'react';
import _ from 'lodash';
import 'react-vis/dist/style.css';
import PropTypes from 'prop-types';
import SelectionMarker from './SelectionMarker';

import { MarkSeries, VerticalGridLines } from 'react-vis';
import { Tooltip } from './Tooltip';

class InteractivePlot extends PureComponent {
  getHoveredPoints = hoverIndex => {
    if (hoverIndex == null) {
      return;
    }

    return this.props.series.map(serie => ({
      ...serie.data[hoverIndex],
      color: serie.color
    }));
  };

  render() {
    const {
      hoverIndex,
      series,
      XYPlot,
      tickFormatY,
      x,
      isDrawing,
      selectionStart,
      selectionEnd
    } = this.props;

    if (_.isEmpty(series)) {
      return null;
    }

    const hoveredPoints = this.getHoveredPoints(hoverIndex);
    const defaultSerie = series[0].data;
    const verticalLineX = _.get(defaultSerie[hoverIndex], 'x');

    return (
      <XYPlot>
        {!!hoveredPoints &&
          !isDrawing && (
            <Tooltip
              hoveredPoints={hoveredPoints}
              series={series}
              valueFormatter={tickFormatY}
              y={0}
            />
          )}
        {!!hoveredPoints &&
          !isDrawing && <MarkSeries data={hoveredPoints} colorType="literal" />}
        {verticalLineX && <VerticalGridLines tickValues={[verticalLineX]} />}

        {isDrawing &&
          selectionEnd !== null && (
            <SelectionMarker start={x(selectionStart)} end={x(selectionEnd)} />
          )}
      </XYPlot>
    );
  }
}

InteractivePlot.propTypes = {
  hoverIndex: PropTypes.number,
  series: PropTypes.array.isRequired,
  XYPlot: PropTypes.func.isRequired,
  tickFormatY: PropTypes.func.isRequired,
  x: PropTypes.func.isRequired,
  isDrawing: PropTypes.bool.isRequired,
  selectionStart: PropTypes.number,
  selectionEnd: PropTypes.number
};

export default InteractivePlot;

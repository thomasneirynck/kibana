import React, { PureComponent } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import 'react-vis/dist/style.css';
import { Voronoi } from 'react-vis';

class VoronoiPlot extends PureComponent {
  render() {
    const { width, series, XY_MARGIN, XY_HEIGHT, XYPlot, x } = this.props;
    const defaultSerie = _.get(series, '[0]');
    const defaultSerieData = _.get(defaultSerie, 'data');
    if (!defaultSerieData || defaultSerie.isEmpty) {
      return null;
    }

    return (
      <XYPlot onMouseLeave={this.props.onMouseLeave}>
        <Voronoi
          extent={[[XY_MARGIN.left, XY_MARGIN.top], [width, XY_HEIGHT]]}
          nodes={defaultSerieData}
          onHover={this.props.onHover}
          onMouseDown={this.props.onMouseDown}
          onMouseUp={this.props.onMouseUp}
          x={d => x(d.x)}
          y={() => 0}
        />
      </XYPlot>
    );
  }
}

export default VoronoiPlot;

VoronoiPlot.propTypes = {
  width: PropTypes.number.isRequired,
  series: PropTypes.array.isRequired,
  XY_MARGIN: PropTypes.object.isRequired,
  XY_HEIGHT: PropTypes.number.isRequired,
  XYPlot: PropTypes.func.isRequired,
  x: PropTypes.func.isRequired,
  onHover: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onMouseUp: PropTypes.func.isRequired
};

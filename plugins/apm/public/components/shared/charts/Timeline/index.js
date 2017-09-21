import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import 'react-vis/dist/style.css';
import { scaleLinear } from 'd3-scale';
import { makeWidthFlexible } from 'react-vis';
import TimelineAxis from './TimelineAxis';
import VerticalLines from './VerticalLines';

const getXScale = _.memoize(
  (xMin, xMax, margins, width) => {
    return scaleLinear()
      .domain([xMin, xMax])
      .range([margins.left, width - margins.right]);
  },
  (xMin, xMax, margins, width) =>
    [xMin, xMax, margins.left, margins.right, width].join('__')
);

const getTicks = _.memoize(
  xScale => xScale.ticks(7),
  xScale => xScale.domain().join('__')
);
const getXDomain = _.memoize(
  xScale => xScale.domain(),
  xScale => xScale.domain().join('__')
);

class Timeline extends PureComponent {
  render() {
    const { width, height, margins, duration, legends } = this.props;

    if (duration == null || !width) {
      return null;
    }

    const xMin = 0;
    const xMax = duration;
    const xScale = getXScale(xMin, xMax, margins, width);
    const xDomain = getXDomain(xScale);
    const tickValues = getTicks(xScale);

    return (
      <div>
        <TimelineAxis
          width={width}
          margins={margins}
          xScale={xScale}
          xDomain={xDomain}
          tickValues={tickValues}
          xMax={xMax}
          legends={legends}
        />

        <VerticalLines
          width={width}
          height={height}
          margins={margins}
          xDomain={xDomain}
          tickValues={tickValues}
          xMax={xMax}
        />
      </div>
    );
  }
}

Timeline.propTypes = {
  width: PropTypes.number
};

export default makeWidthFlexible(Timeline);

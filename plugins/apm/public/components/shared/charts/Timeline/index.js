import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import 'react-vis/dist/style.css';
import { scaleLinear } from 'd3-scale';
import { makeWidthFlexible } from 'react-vis';
import TimelineAxis from './TimelineAxis';
import VerticalLines from './VerticalLines';

const getXScale = _.memoize(
  (xMin, xMax, timelineMargins, width) => {
    return scaleLinear()
      .domain([xMin, xMax])
      .range([timelineMargins.left, width - timelineMargins.right]);
  },
  (xMin, xMax, timelineMargins, width) =>
    [xMin, xMax, timelineMargins.left, timelineMargins.right, width].join('__')
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
    const { width, height, timelineMargins, duration, header } = this.props;

    if (duration == null || !width) {
      return null;
    }

    const xMin = 0;
    const xMax = duration;
    const xScale = getXScale(xMin, xMax, timelineMargins, width);
    const xDomain = getXDomain(xScale);
    const tickValues = getTicks(xScale);

    return (
      <div>
        <TimelineAxis
          width={width}
          timelineMargins={timelineMargins}
          xScale={xScale}
          xDomain={xDomain}
          tickValues={tickValues}
          xMax={xMax}
          header={header}
        />

        <VerticalLines
          width={width}
          height={height}
          timelineMargins={timelineMargins}
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

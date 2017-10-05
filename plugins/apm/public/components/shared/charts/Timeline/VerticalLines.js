import React, { PureComponent } from 'react';
import { XYPlot, VerticalGridLines } from 'react-vis';
import { colors } from '../../../../style/variables';

export default class VerticalLines extends PureComponent {
  render() {
    const {
      width,
      height,
      timelineMargins,
      xDomain,
      tickValues,
      xMax
    } = this.props;

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <XYPlot
          dontCheckIfEmpty
          width={width}
          height={height + timelineMargins.top}
          margin={timelineMargins}
          xDomain={xDomain}
        >
          <VerticalGridLines
            tickValues={tickValues}
            style={{ stroke: colors.gray5 }}
          />
          <VerticalGridLines
            tickValues={[xMax]}
            style={{ stroke: colors.gray3 }}
          />
        </XYPlot>
      </div>
    );
  }
}

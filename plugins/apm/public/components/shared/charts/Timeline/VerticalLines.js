import React, { PureComponent } from 'react';
import { XYPlot, VerticalGridLines } from 'react-vis';
import { colors } from '../../../../style/variables';

export default class VerticalLines extends PureComponent {
  render() {
    const { width, height, margins, xDomain, tickValues, xMax } = this.props;

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
          height={height + margins.top}
          margin={margins}
          xDomain={xDomain}
        >
          <VerticalGridLines tickValues={tickValues} />
          <VerticalGridLines
            tickValues={[xMax]}
            style={{ stroke: colors.gray2 }}
          />
        </XYPlot>
      </div>
    );
  }
}

import React from 'react';
import _ from 'lodash';
import { Sticky } from 'react-sticky';
import { XYPlot, XAxis } from 'react-vis';
import LastTickValue from './LastTickValue';
import { getTimeFormatter } from '../../../../utils/formatters';
import { colors } from '../../../../style/variables';

// Remove last tick if it's too close to xMax
const getXAxisTickValues = (tickValues, xMax) =>
  _.last(tickValues) * 1.05 > xMax ? tickValues.slice(0, -1) : tickValues;

function TimelineAxis({
  xScale,
  xDomain,
  width,
  timelineMargins,
  tickValues,
  xMax,
  header
}) {
  const tickFormat = getTimeFormatter(xMax);
  const xAxisTickValues = getXAxisTickValues(tickValues, xMax);

  return (
    <Sticky disableCompensation>
      {({ style }) => {
        return (
          <div
            style={{
              position: 'absolute',
              backgroundColor: colors.white,
              borderBottom: `1px solid ${colors.gray3}`,
              height: `${timelineMargins.top}px`,
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              zIndex: 2,
              ...style
            }}
          >
            {header}
            <XYPlot
              dontCheckIfEmpty
              width={width}
              height={20}
              margin={{
                top: 20,
                left: timelineMargins.left,
                right: timelineMargins.right
              }}
              xDomain={xDomain}
            >
              <XAxis
                hideLine
                orientation="top"
                tickSize={0}
                tickValues={xAxisTickValues}
                tickFormat={tickFormat}
                style={{
                  text: { fill: colors.gray3 }
                }}
              />

              <LastTickValue x={xScale(xMax)} value={tickFormat(xMax)} />
            </XYPlot>
          </div>
        );
      }}
    </Sticky>
  );
}

export default TimelineAxis;

import React from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import TraceDetails from './TraceDetails';
import { toQuery, fromQuery } from '../../../../../utils/url';
import { KuiPopover } from 'ui_framework/components';
import { isNumber, get } from 'lodash';
import './KuiPopover-overrides.css';

import {
  unit,
  units,
  colors,
  px,
  fontFamilyCode,
  fontSizes
} from '../../../../../style/variables';
import {
  TRACE_DURATION,
  TRACE_START,
  TRACE_ID,
  TRACE_NAME
} from '../../../../../../common/constants';

function closePopover() {}

const TraceBar = styled.div`
  position: relative;
  height: ${unit}px;
`;
const TraceLabel = styled.div`
  white-space: nowrap;
  position: relative;
  direction: rtl;
  text-align: left;
  margin: ${px(units.quarter)} 0;
  font-family: ${fontFamilyCode};
  font-size: ${fontSizes.small};
`;

const Popover = styled(({ isSelected, timelineMargins, ...props }) => (
  <KuiPopover {...props} />
))`
  display: block;
  user-select: none;
  padding: ${px(units.half)} ${props => px(props.timelineMargins.right)}
    ${px(units.half)} ${props => px(props.timelineMargins.left)};
  border-top: 1px solid ${colors.gray4};
  background-color: ${props => (props.isSelected ? colors.gray5 : 'initial')};
  &:hover {
    background-color: ${colors.gray5};
  }
`;

function Trace({
  timelineMargins,
  history,
  location,
  totalDuration,
  trace,
  color,
  isSelected
}) {
  const width = get({ trace }, TRACE_DURATION) / totalDuration * 100;
  const left = get({ trace }, TRACE_START) / totalDuration * 100;

  const traceId = get({ trace }, TRACE_ID);
  const traceName = get({ trace }, TRACE_NAME);

  const button = (
    <div>
      <TraceBar
        style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
      />
      <TraceLabel style={{ left: `${left}%`, width: `${100 - left}%` }}>
        {traceName}
      </TraceLabel>
    </div>
  );

  return (
    <Popover
      onClick={() => {
        const { traceId: currentTraceId, ...currentQuery } = toQuery(
          location.search
        );
        const shouldClose =
          isNumber(parseInt(currentTraceId, 10)) &&
          !Number.isNaN(parseInt(currentTraceId, 10));

        history.push({
          ...location,
          search: fromQuery({
            ...currentQuery,
            traceId: shouldClose ? null : traceId
          })
        });
      }}
      timelineMargins={timelineMargins}
      isSelected={isSelected}
      panelClassName="apm-overrides"
      button={button}
      isOpen={isSelected}
      closePopover={closePopover}
    >
      <TraceDetails trace={trace} totalDuration={totalDuration} />
    </Popover>
  );
}

export default withRouter(Trace);

import React from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import TraceDetails from './TraceDetails';
import { toQuery, fromQuery } from '../../../../../utils/url';
import { KuiPopover } from 'ui_framework/components';
import { isNumber, get } from 'lodash';
import './KuiPopover-overrides.css';

import { unit, colors, px } from '../../../../../style/variables';
import { truncate } from '../../../../../style/utils';
import {
  TRACE_DURATION,
  TRACE_START,
  TRACE_ID,
  TRACE_NAME
} from '../../../../../../common/constants';

function closePopover() {}

const TraceBar = styled.div`
  position: relative;
  width: ${props => props.width}%;
  left: ${props => props.left}%;
  background: ${props => props.color};
  height: ${unit}px;
`;

const breakpoint = 70;
const TraceName = styled.div`
  ${truncate('100%')};
  position: relative;
  right: ${props =>
    props.left > breakpoint ? `${100 - props.width - props.left}%` : 'initial'};
  left: ${props => (props.left > breakpoint ? 'initial' : `${props.left}%`)};
  text-align: ${props => (props.left > breakpoint ? 'right' : 'left')};
`;

const Popover = styled(({ isSelected, ...props }) => <KuiPopover {...props} />)`
  display: block;
  user-select: none;
  padding: ${px(unit)};
  border-top: 1px solid ${colors.gray4};
  background-color: ${props => (props.isSelected ? 'yellow' : 'initial')};
  &:hover {
    background-color: ${props => (props.isSelected ? 'yellow' : colors.gray5)};
  }
`;

function Trace({ history, location, totalDuration, trace, color, isSelected }) {
  const width = get({ trace }, TRACE_DURATION) / totalDuration * 100;
  const left = get({ trace }, TRACE_START) / totalDuration * 100;

  const traceId = get({ trace }, TRACE_ID);
  const traceName = get({ trace }, TRACE_NAME);

  const button = (
    <div>
      <TraceBar left={left} width={width} color={color} />
      <TraceName left={left} width={width}>
        {traceName}
      </TraceName>
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
      isSelected={isSelected}
      bodyClassName="apm-overrides"
      button={button}
      isOpen={isSelected}
      closePopover={closePopover}
    >
      <TraceDetails trace={trace} totalDuration={totalDuration} />
    </Popover>
  );
}

export default withRouter(Trace);

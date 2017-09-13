import React from 'react';
import styled from 'styled-components';
import { RelativeLink } from '../../../../../utils/url';
import TraceDetails from './TraceDetails';

import { unit, units, colors, px } from '../../../../../style/variables';
import { truncate } from '../../../../../style/utils';
import {
  TRACE_DURATION,
  TRACE_START,
  TRACE_ID,
  TRACE_NAME
} from '../../../../../../common/constants';
import { get } from 'lodash';

const TraceBar = styled.div`
  background: ${colors.gray4};
  height: ${unit}px;
`;
const TraceName = styled.div`${truncate(px(unit * 15))};`;
const TraceLink = styled(({ isSelected, children, ...props }) => (
  <RelativeLink {...props}>{children}</RelativeLink>
))`
  border-top: ${({ isSelected }) => isSelected && `1px solid ${colors.gray4}`};
  border-bottom: ${({ isSelected }) =>
    isSelected && `1px solid ${colors.gray4}`};
  display: block;
  &:hover {
    background-color: ${colors.gray5};
  }
  &:focus {
    box-shadow: none;
  }
`;

function Trace({ totalDuration, trace, isSelected }) {
  const width = get({ trace }, TRACE_DURATION) / totalDuration * 100;
  const left = get({ trace }, TRACE_START) / totalDuration * 100;
  const TraceContainer = styled.div`
    position: relative;
    margin: ${unit}px 0;
    height: ${isSelected ? 'initial' : px(units.double)};
    width: ${width}%;
    left: ${left}%;
  `;
  const traceId = get({ trace }, TRACE_ID);
  const traceName = get({ trace }, TRACE_NAME);

  return (
    <TraceLink query={{ traceId }} isSelected={isSelected}>
      <TraceContainer title={traceName}>
        <TraceBar />
        <TraceName>{traceName}</TraceName>
      </TraceContainer>

      {isSelected && (
        <TraceDetails trace={trace} totalDuration={totalDuration} />
      )}
    </TraceLink>
  );
}

export default Trace;

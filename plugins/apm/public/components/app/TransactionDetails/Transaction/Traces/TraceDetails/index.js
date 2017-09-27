import React from 'react';
import styled from 'styled-components';
import numeral from 'numeral';
import { get, first } from 'lodash';
import { KuiButton } from 'ui_framework/components';
import CodePreview from '../../../../../shared/CodePreview';
import {
  TRACE_DURATION,
  TRACE_NAME
} from '../../../../../../../common/constants';
import {
  unit,
  units,
  px,
  colors,
  fontSizes
} from '../../../../../../style/variables';

const DetailsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid ${colors.gray5};
  margin-bottom: ${px(units.minus)};
  padding: ${px(unit)} ${px(units.quarter)};
`;
const DetailsHeader = styled.div`
  font-weight: 100;
  font-size: ${fontSizes.large};
  color: ${colors.gray1};
`;
const DetailsHeaderSmall = DetailsHeader.extend`font-size: ${fontSizes.small};`;
const DetailsText = styled.div`font-size: ${fontSizes.large};`;
const DiscoverButton = styled(KuiButton)`
  align-self: center;
  background-color: ${colors.blue1};
  color: ${colors.white};
`;

const getInAppStackframe = stacktrace =>
  first(stacktrace.filter(stacktrace => stacktrace.inApp));

function TraceDetails({ trace, totalDuration }) {
  const traceDuration = get({ trace }, TRACE_DURATION);
  const relativeDuration = traceDuration / totalDuration;
  // const sql = get(trace, TRACE_SQL);
  const stackframe = getInAppStackframe(trace.stacktrace);
  const traceName = get({ trace }, TRACE_NAME);

  if (!stackframe) {
    return <div>No stacktrace</div>;
  }

  return (
    <div>
      <DetailsWrapper>
        <div>
          <DetailsHeader>Trace details</DetailsHeader>
          <DetailsText>{traceName}</DetailsText>
        </div>
        <div>
          <DetailsHeaderSmall>Trace duration</DetailsHeaderSmall>
          <DetailsText>
            {numeral(traceDuration / 1000).format('0.00')} ms
          </DetailsText>
        </div>
        <div>
          <DetailsHeaderSmall>% of total time</DetailsHeaderSmall>
          <DetailsText>{numeral(relativeDuration).format('0.00%')}</DetailsText>
        </div>
        <DiscoverButton>Open in Discover</DiscoverButton>
      </DetailsWrapper>
      {/* <div>{sql}</div> */}

      <CodePreview stackframe={stackframe} />
    </div>
  );
}

export default TraceDetails;

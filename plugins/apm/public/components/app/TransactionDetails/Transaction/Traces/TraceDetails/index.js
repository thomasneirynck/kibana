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
  padding: ${px(unit)} ${px(units.plus)};
  box-shadow: 0 -${units.minus}px ${units.double}px ${units.eighth}px ${colors.black};
  position: relative;
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

const CodePreviewContainer = styled.div`
  max-height: ${px(unit * 20)};
  overflow: scroll;
  padding: 0 ${px(units.minus)};
`;

const getInAppStackframe = stacktrace =>
  first(stacktrace.filter(stacktrace => stacktrace.inApp));

function TraceDetails({ trace, totalDuration }) {
  const traceDuration = get({ trace }, TRACE_DURATION);
  const relativeDuration = traceDuration / totalDuration;

  const stackframe = getInAppStackframe(trace.stacktrace);
  const traceName = get({ trace }, TRACE_NAME);

  if (!stackframe) {
    return <div>No stacktrace</div>;
  }

  return (
    <div style={{ overflow: 'hidden' }}>
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

      <CodePreviewContainer>
        <CodePreview stackframe={stackframe} />
      </CodePreviewContainer>
    </div>
  );
}

export default TraceDetails;

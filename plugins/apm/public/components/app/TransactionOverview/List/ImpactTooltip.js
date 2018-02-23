import React from 'react';
import styled from 'styled-components';
import { units, px } from '../../../../style/variables';
import { EuiIcon } from '@elastic/eui';
import { Tooltip } from 'pivotal-ui/react/tooltip';
import { OverlayTrigger } from 'pivotal-ui/react/overlay-trigger';

const TooltipWrapper = styled.div`
  margin-left: ${px(units.half)};
`;

const ImpactTooltip = () => (
  <TooltipWrapper>
    <OverlayTrigger
      placement="top"
      trigger="hover"
      overlay={
        <Tooltip>
          Impact shows the most used and<br />slowest endpoints in your service.
        </Tooltip>
      }
    >
      <EuiIcon type="questionInCircle" />
    </OverlayTrigger>
  </TooltipWrapper>
);

export default ImpactTooltip;

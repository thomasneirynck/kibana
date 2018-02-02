import React from 'react';
import styled from 'styled-components';
import { units, px } from '../../../../style/variables';
import { KuiInfoButton } from 'ui_framework/components';
import TooltipOverlay from '../../../shared/TooltipOverlay';

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
  top: 1px;
  left: ${px(units.half)};
  margin-right: ${px(units.quarter * 3)};
`;

const ImpactTooltip = () => (
  <TooltipWrapper>
    <TooltipOverlay
      delay={0}
      content={
        <span>
          Impact shows the most used and<br />slowest endpoints in your service.
        </span>
      }
    >
      <KuiInfoButton
        onClick={e => {
          // TODO: Remove this handler once issue with pivotal-ui/react/overlay-trigger has been resolved
          e.stopPropagation();
          return false;
        }}
      />
    </TooltipOverlay>
  </TooltipWrapper>
);

export default ImpactTooltip;

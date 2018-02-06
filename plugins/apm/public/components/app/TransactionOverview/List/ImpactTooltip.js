import React from 'react';
import styled from 'styled-components';
import { units, px, colors } from '../../../../style/variables';
import { Info } from '../../../shared/Icons';
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
      <Info
        style={{ color: colors.blue2 }}
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

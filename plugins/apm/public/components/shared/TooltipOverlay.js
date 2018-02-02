import React from 'react';
import styled from 'styled-components';
import { fontFamilyCode } from '../../style/variables';
import { Tooltip } from 'pivotal-ui/react/tooltip';
import { OverlayTrigger } from 'pivotal-ui/react/overlay-trigger';

const TooltipFieldName = styled.span`
  font-family: ${fontFamilyCode};
`;

function TooltipOverlay({ children, content, delay = 1000 }) {
  return (
    <OverlayTrigger
      placement="top"
      trigger="hover"
      delay={delay}
      overlay={<Tooltip>{content}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
}

export function fieldNameHelper(name) {
  return (
    <span>
      Field name: <br />
      <TooltipFieldName>{name}</TooltipFieldName>
    </span>
  );
}

export default TooltipOverlay;

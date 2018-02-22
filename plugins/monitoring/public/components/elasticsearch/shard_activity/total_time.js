import React from 'react';
import { EuiLink } from '@elastic/eui';
import { Tooltip } from 'plugins/monitoring/components/tooltip';

export const TotalTime = ({ startTime, totalTime }) => {
  return (
    <Tooltip text={`Started: ${startTime}`} placement="bottom" trigger="hover">
      <EuiLink>{totalTime}</EuiLink>
    </Tooltip>
  );
};

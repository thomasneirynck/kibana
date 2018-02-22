import React from 'react';
import { EuiIcon, EuiLink, EuiFlexGroup, EuiFlexItem, } from '@elastic/eui';
import { Tooltip } from 'plugins/monitoring/components/tooltip';
import { SourceTooltip } from './source_tooltip';

export const SourceDestination = (props) => {
  const { sourceName, targetName, targetTransportAddress } = props;
  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <SourceTooltip {...props}>
          {sourceName}
        </SourceTooltip>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiIcon type="arrowRight" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <Tooltip
          text={targetTransportAddress}
          placement="bottom"
          trigger="hover"
        >
          <EuiLink>{targetName}</EuiLink>
        </Tooltip>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

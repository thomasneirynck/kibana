import React, { Fragment } from 'react';
import { EuiLink } from '@elastic/eui';
import { Tooltip } from 'plugins/monitoring/components/tooltip';

export const SourceTooltip = ({ isCopiedFromPrimary, sourceTransportAddress, children }) => {
  if (!sourceTransportAddress) {
    return children;
  }

  const tipText = (
    <Fragment>
      {sourceTransportAddress}
      <br />
      Copied from { isCopiedFromPrimary ? 'primary' : 'replica' } shard
    </Fragment>
  );

  return (
    <Tooltip text={tipText} placement="bottom" trigger="hover">
      <EuiLink>{children}</EuiLink>
    </Tooltip>
  );
};

import React from 'react';
import { KibanaLink } from '../../utils/url';
import { EuiButton } from '@elastic/eui';

function DiscoverButton({ query, children }) {
  return (
    <KibanaLink pathname={'/app/kibana'} hash={'/discover'} query={query}>
      <EuiButton color="secondary" iconType="discoverApp">
        {children || 'View in Discover'}
      </EuiButton>
    </KibanaLink>
  );
}

export default DiscoverButton;

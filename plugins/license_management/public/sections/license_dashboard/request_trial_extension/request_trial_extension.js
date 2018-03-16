import React from 'react';

import { EuiFlexItem, EuiCard, EuiLink, EuiButton } from '@elastic/eui';

export const RequestTrialExtension = ({ shouldShowRequestTrialExtension }) => {
  if (!shouldShowRequestTrialExtension) {
    return null;
  }
  const description = (
    <span>
      If you’d like to continuing using Security, Machine Learning, and our
      other awesome{' '}
      <EuiLink
        href="https://www.elastic.co/subscriptions/xpack"
        target="_blank"
      >
        platinum features
      </EuiLink>, request an extension now.
    </span>
  );
  return (
    <EuiFlexItem>
      <EuiCard
        title="Extend your trial"
        description={description}
        footer={
          <EuiButton
            style={{ marginTop: 'auto' }}
            target="_blank"
            href="https://www.elastic.co/trialextension"
          >
            Extend trial
          </EuiButton>
        }
      />
    </EuiFlexItem>
  );
};

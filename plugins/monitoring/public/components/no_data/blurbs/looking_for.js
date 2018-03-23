import React, { Fragment } from 'react';
import { EuiTitle, EuiText, EuiTextColor } from '@elastic/eui';

export const LookingFor = () => {
  return (
    <Fragment>
      <EuiTitle size="l">
        <h2>We&apos;re looking for your monitoring data</h2>
      </EuiTitle>
      <EuiTextColor color="subdued">
        <EuiText>
          <p>Monitoring provides insight to your hardware performance and load.</p>
        </EuiText>
      </EuiTextColor>
    </Fragment>
  );
};

import React from 'react';
import { BASE_PATH } from '../../../../common/constants';

import { EuiFlexItem, EuiCard, EuiButton } from '@elastic/eui';

export const AddLicense = () => {
  return (
    <EuiFlexItem>
      <EuiCard
        title="Update your license"
        description="If you already have a new license, upload it now"
        footer={
          <EuiButton
            style={{ marginTop: 'auto' }}
            href={`#${BASE_PATH}upload_license`}
          >
            Update license
          </EuiButton>
        }
      />
    </EuiFlexItem>
  );
};

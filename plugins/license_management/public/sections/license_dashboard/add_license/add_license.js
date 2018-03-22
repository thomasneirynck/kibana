import React from 'react';
import { BASE_PATH } from '../../../../common/constants';

import { EuiCard, EuiButton } from '@elastic/eui';

export const AddLicense = ({ uploadPath = `#${BASE_PATH}upload_license` }) => {
  return (
    <EuiCard
      title="Update your license"
      description="If you already have a new license, upload it now"
      footer={
        <EuiButton
          style={{ marginTop: 'auto' }}
          href={uploadPath}
        >
          Update license
        </EuiButton>
      }
    />
  );
};

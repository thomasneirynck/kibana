import React from 'react';


import { LicenseStatus } from './license_status';
import { RevertToBasic } from './revert_to_basic';
import { StartTrial } from './start_trial';
import { AddLicense } from './add_license';
import { RequestTrialExtension } from './request_trial_extension';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer
} from '@elastic/eui';

export const LicenseDashboard = () => {
  return (
    <div className="licenseManagement__contain">
      <EuiFlexGroup justifyContent="spaceAround">
        <LicenseStatus />
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="spaceAround">
        <EuiFlexItem>
          <AddLicense />
        </EuiFlexItem>
        <StartTrial />
        <RequestTrialExtension/>
        <RevertToBasic/>
      </EuiFlexGroup>
    </div>
  );
};

import { connect } from 'react-redux';

import { RevertToBasic as PresentationComponent } from './revert_to_basic';
import {
  startBasicLicenseNeedsAcknowledgement,
  getLicenseType,
  shouldShowRevertToBasicLicense,
  getStartBasicMessages
} from '../../../store/reducers/licenseManagement';
import { startBasicLicense } from '../../../store/actions/start_basic';

const mapStateToProps = state => {
  return {
    shouldShowRevertToBasicLicense: shouldShowRevertToBasicLicense(state),
    licenseType: getLicenseType(state),
    needsAcknowledgement: startBasicLicenseNeedsAcknowledgement(state),
    messages: getStartBasicMessages(state)
  };
};

const mapDispatchToProps = {
  startBasicLicense
};

export const RevertToBasic = connect(mapStateToProps, mapDispatchToProps)(
  PresentationComponent
);

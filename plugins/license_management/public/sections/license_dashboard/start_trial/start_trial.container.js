import { connect } from 'react-redux';

import { StartTrial as PresentationComponent } from './start_trial';
import { loadTrialStatus, startLicenseTrial } from '../../../store/actions/start_trial';
import { shouldShowStartTrial } from '../../../store/reducers/licenseManagement';

const mapStateToProps = (state) => {
  return {
    shouldShowStartTrial: shouldShowStartTrial(state),
  };
};

const mapDispatchToProps = {
  loadTrialStatus,
  startLicenseTrial
};

export const StartTrial = connect(mapStateToProps, mapDispatchToProps)(PresentationComponent);

import { connect } from 'react-redux';

import { RequestTrialExtension as PresentationComponent } from './request_trial_extension';
import {
  shouldShowRequestTrialExtension
} from '../../../store/reducers/licenseManagement';


const mapStateToProps = state => {
  return {
    shouldShowRequestTrialExtension: shouldShowRequestTrialExtension(state),
  };
};

export const RequestTrialExtension = connect(mapStateToProps)(
  PresentationComponent
);

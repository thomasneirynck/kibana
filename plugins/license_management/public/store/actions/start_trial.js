import { createAction } from 'redux-actions';
import { canStartTrial, startTrial } from '../../lib/es';
import { toastNotifications } from 'ui/notify';

export const trialStatusLoaded = createAction(
  'LICENSE_MANAGEMENT_TRIAL_STATUS_LOADED'
);

export const loadTrialStatus = () => async dispatch => {
  const trialOK = await canStartTrial();
  dispatch(trialStatusLoaded(trialOK));
};

export const startLicenseTrial = () => async (
  dispatch,
  getState,
  { xPackInfo }
) => {
  /*eslint camelcase: 0*/
  const { trial_was_started, error_message } = await startTrial();
  if (trial_was_started) {
    await xPackInfo.refresh();
    // reload necessary to get left nav to refresh with proper links
    window.location.reload();
  } else {
    return toastNotifications.addDanger(error_message);
  }
};

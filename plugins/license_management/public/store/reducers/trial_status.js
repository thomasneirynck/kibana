import { handleActions } from 'redux-actions';

import { trialStatusLoaded } from '../actions/start_trial';

export const trialStatus = handleActions({
  [trialStatusLoaded](state, { payload }) {
    return {
      canStartTrial: payload
    };
  },
}, {});